"""
Lead Flow - Service Layer
=========================
Capa de servicios que encapsula toda la lógica de negocio.
Las vistas (api.py) NUNCA deben contener lógica de dominio directamente.

Decisiones de diseño:
- WebhookProcessor usa select_for_update() de PostgreSQL para
  row-level locking durante el upsert de leads.
- El UNIQUE constraint en original_email actúa como red de seguridad
  adicional contra condiciones de carrera extremas.
"""

import logging
from typing import Optional

from django.db import transaction, IntegrityError
from django.utils import timezone

from .models import Lead, Source, Interaction, WebhookLog

logger = logging.getLogger(__name__)


class WebhookProcessor:
    """
    Procesa payloads de webhook para crear/actualizar leads.

    Flujo:
    1. Se crea un WebhookLog con status=PENDING.
    2. Se valida el payload y se extrae email + source_type.
    3. Se ejecuta un upsert atómico con select_for_update.
    4. Se actualiza el WebhookLog a SUCCESS o FAILED.
    """

    # Campos que se actualizan si llegan datos nuevos y los existentes están vacíos
    MERGEABLE_FIELDS = ["first_name", "last_name", "phone", "address", "company"]

    def __init__(self, source_type: str, raw_body: dict):
        self.source_type = source_type
        self.raw_body = raw_body
        self.webhook_log: Optional[WebhookLog] = None

    def create_log(self) -> WebhookLog:
        """Paso 1: Registrar el webhook crudo inmediatamente."""
        self.webhook_log = WebhookLog.objects.create(
            source_type=self.source_type,
            raw_body=self.raw_body,
            status=WebhookLog.Status.PENDING,
        )
        return self.webhook_log

    def process(self) -> WebhookLog:
        """
        Paso 2-4: Validar, hacer upsert, y actualizar el log.
        Este método se llama DESPUÉS de que el endpoint ya respondió 200.
        """
        if not self.webhook_log:
            self.create_log()

        try:
            # ── Extraer y validar campos del payload ──────────────────
            email = self._extract_email()
            if not email:
                raise ValueError("El campo 'email' es requerido y no fue encontrado en el payload.")

            source = self._resolve_source()
            lead_data = self._extract_lead_data()

            # ── Upsert atómico con Row-Level Locking ──────────────────
            lead, interaction = self._upsert_lead(email, source, lead_data)

            # ── Marcar como exitoso ───────────────────────────────────
            self.webhook_log.status = WebhookLog.Status.SUCCESS
            self.webhook_log.lead = lead
            self.webhook_log.processed_at = timezone.now()
            self.webhook_log.save()

            logger.info(
                "Webhook procesado exitosamente: lead=%s, source=%s",
                lead.id, self.source_type,
            )

        except Exception as exc:
            self.webhook_log.status = WebhookLog.Status.FAILED
            self.webhook_log.error_message = str(exc)
            self.webhook_log.processed_at = timezone.now()
            self.webhook_log.save()
            logger.error("Webhook fallido: %s", exc)

        return self.webhook_log

    def _extract_email(self) -> Optional[str]:
        """Busca el email en el payload con flexibilidad de claves."""
        body = self.webhook_log.edited_body or self.raw_body
        for key in ("email", "Email", "EMAIL", "correo", "mail"):
            if key in body and body[key]:
                return body[key].strip().lower()
        return None

    def _resolve_source(self) -> Source:
        """Busca o crea la fuente en el catálogo."""
        source, _ = Source.objects.get_or_create(
            slug=self.source_type.lower().strip(),
            defaults={
                "name": self.source_type.title(),
            },
        )
        return source

    def _extract_lead_data(self) -> dict:
        """Extrae campos del lead desde el payload con mapeo flexible."""
        body = self.webhook_log.edited_body or self.raw_body
        return {
            "first_name": body.get("first_name", body.get("nombre", "")),
            "last_name": body.get("last_name", body.get("apellido", "")),
            "phone": body.get("phone", body.get("telefono", body.get("tel", ""))),
            "address": body.get("address", body.get("direccion", "")),
            "company": body.get("company", body.get("empresa", "")),
        }

    def _upsert_lead(self, email: str, source: Source, data: dict):
        """
        Upsert atómico con select_for_update (PostgreSQL row-level lock).

        Si el lead existe:
          - Bloquea la fila para evitar condiciones de carrera.
          - Actualiza campos vacíos con datos nuevos (merge strategy).
          - Crea una nueva Interaction en el timeline.

        Si el lead no existe:
          - Intenta crear el lead.
          - Si falla por IntegrityError (race condition), recupera el existente.
        """
        try:
            with transaction.atomic():
                # Intentar obtener lead existente con bloqueo de fila
                try:
                    lead = (
                        Lead.objects
                        .select_for_update()
                        .get(original_email=email)
                    )
                    # Lead existe → merge de campos vacíos
                    self._merge_fields(lead, data)
                    lead.save()

                except Lead.DoesNotExist:
                    # Lead no existe → crear nuevo
                    lead = Lead.objects.create(
                        original_email=email,
                        contact_email=email,  # Inicialmente el mismo
                        first_source=source,
                        **{k: v for k, v in data.items() if v},
                    )

                # Crear interacción en el timeline
                interaction = Interaction.objects.create(
                    lead=lead,
                    source=source,
                    raw_payload=self.raw_body,
                )
                return lead, interaction

        except IntegrityError:
            # Red de seguridad: condición de carrera extrema donde
            # dos threads pasaron el DoesNotExist simultáneamente.
            logger.warning(
                "IntegrityError capturado para email=%s. Recuperando lead existente.",
                email,
            )
            lead = Lead.objects.get(original_email=email)
            interaction = Interaction.objects.create(
                lead=lead,
                source=source,
                raw_payload=self.raw_body,
            )
            return lead, interaction

    def _merge_fields(self, lead: Lead, data: dict):
        """
        Actualiza campos del lead SOLO si están vacíos.
        Respeta los datos que el vendedor ya haya editado manualmente.
        """
        updated = False
        for field in self.MERGEABLE_FIELDS:
            current_value = getattr(lead, field, "")
            new_value = data.get(field, "")
            if not current_value and new_value:
                setattr(lead, field, new_value)
                updated = True
        return updated


class ReprocessWebhook:
    """
    Re-procesa un WebhookLog fallido después de que el vendedor
    editó el JSON manualmente.
    """

    @staticmethod
    def reprocess(webhook_log: WebhookLog, edited_body: dict, user=None) -> WebhookLog:
        """
        Guarda el JSON editado y re-ejecuta el procesamiento.
        """
        webhook_log.edited_body = edited_body
        webhook_log.edited_by = user
        webhook_log.status = WebhookLog.Status.PENDING
        webhook_log.error_message = ""
        webhook_log.save()

        processor = WebhookProcessor(
            source_type=webhook_log.source_type,
            raw_body=webhook_log.raw_body,
        )
        processor.webhook_log = webhook_log
        return processor.process()
