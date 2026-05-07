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

from django.contrib.auth.models import User
from django.db import transaction, IntegrityError
from django.utils import timezone
from django_q.tasks import async_task

from .models import Lead, Source, Interaction, WebhookLog, RoundRobinState

logger = logging.getLogger(__name__)


class WebhookProcessor:
    """
    Orquestador principal para la ingesta de datos externos.
    Diseñado para ser resiliente a fallos y concurrencia.

    Flujo detallado:
    1. Registro: Crea un WebhookLog en estado 'pending'.
    2. Identificación: Busca el email del contacto.
    3. Resolución de Entidad (Upsert): Aplica política de merge o crea nuevo.
    4. Automatización: Activa Round Robin y Nurturing.
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
                val = body[key]
                if isinstance(val, str):
                    val = val.strip().lower()
                    if len(val) <= 254:
                        return val
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

    def _safe_str(self, value, max_length=None) -> str:
        """Convierte de forma segura cualquier valor a string y trunca si se excede."""
        if value is None:
            return ""
        
        # Si es estructura compleja (ej. un teléfono enviado como lista)
        if isinstance(value, (dict, list)):
            import json
            try:
                val_str = json.dumps(value, ensure_ascii=False)
            except Exception:
                val_str = str(value)
        else:
            val_str = str(value).strip()
            
        if max_length and len(val_str) > max_length:
            return val_str[:max_length]
        return val_str

    def _extract_lead_data(self) -> dict:
        """Extrae campos del lead desde el payload con mapeo flexible y sanitización."""
        body = self.webhook_log.edited_body or self.raw_body
        return {
            "first_name": self._safe_str(body.get("first_name", body.get("nombre", "")), 150),
            "last_name": self._safe_str(body.get("last_name", body.get("apellido", "")), 150),
            "phone": self._safe_str(body.get("phone", body.get("telefono", body.get("tel", ""))), 50),
            "address": self._safe_str(body.get("address", body.get("direccion", ""))), # TextField, no max_length
            "company": self._safe_str(body.get("company", body.get("empresa", "")), 200),
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
                    
                    # Distribuir mediante Round Robin
                    LeadDistributionService.assign(lead)
                    
                    # Nurturing: Enviar correo de bienvenida si califica (fuera de la transacción idealmente, 
                    # pero como las tareas async van a la cola, está bien encolarla aquí).
                    if getattr(lead, 'score', 0) >= 70:
                        async_task('leads.tasks.task_send_welcome_email', str(lead.id))

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
        Implementa una política de 'llenado de huecos'.
        Si un campo en el lead está vacío y el webhook trae un valor, se actualiza.
        Esto protege los datos corregidos manualmente por el vendedor.
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


class LeadDistributionService:
    """
    Motor de asignación automática de prospectos.
    Utiliza el patrón Singleton State para persistir el turno del carrusel.
    """

    @staticmethod
    def assign(lead: Lead) -> Lead:
        """Asigna el lead al siguiente vendedor en el carrusel y actualiza el estado."""
        # 1. Obtener vendedores activos y disponibles (que no sean admin)
        active_vendors = list(User.objects.filter(
            is_active=True, 
            is_staff=False,
            vendor_profile__is_available_for_leads=True
        ).order_by('id'))
        
        if not active_vendors:
            logger.warning("No hay vendedores activos para asignar el lead %s", lead.id)
            return lead

        # 2. Obtener estado de Round Robin con bloqueo de fila para concurrencia
        with transaction.atomic():
            state = RoundRobinState.objects.select_for_update().get_or_create(id=1)[0]
            
            # 3. Determinar el siguiente vendedor
            next_vendor = active_vendors[0] # Default al primero
            
            if state.last_assigned_user:
                # Buscar el índice del último vendedor
                last_index = -1
                for i, vendor in enumerate(active_vendors):
                    if vendor.id == state.last_assigned_user.id:
                        last_index = i
                        break
                
                # Calcular el siguiente índice (carrusel)
                next_index = (last_index + 1) % len(active_vendors)
                next_vendor = active_vendors[next_index]
            
            # 4. Asignar y guardar
            lead.assigned_to = next_vendor
            lead.save(update_fields=['assigned_to'])
            
            state.last_assigned_user = next_vendor
            state.save()
            
            logger.info("Lead %s asignado automáticamente a %s", lead.id, next_vendor.username)
            
            # Alerta: Enviar correo al vendedor
            async_task('leads.tasks.task_send_vendor_alert', str(lead.id), next_vendor.id)
        
        return lead

