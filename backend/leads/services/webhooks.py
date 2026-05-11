import logging
from typing import Optional
from django.db import transaction, IntegrityError
from django.utils import timezone
from django_q.tasks import async_task
from django.db.models import Q

from ..models import Lead, Source, Interaction, WebhookLog
from .distribution import LeadDistributionService

logger = logging.getLogger(__name__)

class WebhookProcessor:
    """
    Cerebro del sistema de captura. Se encarga de recibir basura (JSON crudo)
    y transformarla en un Lead calificado y asignado.
    """

    SYNC_FIELDS = [
        "first_name", "last_name", "phone", "address", "company",
        "investment_goal", "investment_capacity"
    ]

    def __init__(self, source_type: str, raw_body: dict):
        self.source_type = source_type
        self.raw_body = raw_body
        self.webhook_log: Optional[WebhookLog] = None

    def create_log(self) -> WebhookLog:
        self.webhook_log = WebhookLog.objects.create(
            source_type=self.source_type,
            raw_body=self.raw_body,
            status=WebhookLog.Status.PENDING,
        )
        return self.webhook_log

    def process(self) -> WebhookLog:
        if not self.webhook_log:
            self.create_log()

        try:
            email = self._extract_email()
            if not email:
                raise ValueError("No se encontró un email válido en el payload.")

            source = self._resolve_source()
            lead_data = self._extract_lead_data()
            lead, interaction = self._upsert_lead(email, source, lead_data)

            self.webhook_log.status = WebhookLog.Status.SUCCESS
            self.webhook_log.lead = lead
            self.webhook_log.processed_at = timezone.now()
            self.webhook_log.save()
            self.webhook_log.refresh_from_db()

            logger.info(f"Éxito: Lead {lead.id} capturado desde {self.source_type}")

        except Exception as exc:
            self.webhook_log.status = WebhookLog.Status.FAILED
            self.webhook_log.error_message = str(exc)
            self.webhook_log.processed_at = timezone.now()
            self.webhook_log.save()
            logger.error(f"Error procesando webhook: {exc}")

        return self.webhook_log

    def _extract_email(self) -> Optional[str]:
        body = self.webhook_log.edited_body or self.raw_body
        for key in ("email", "Email", "EMAIL", "correo", "mail"):
            if key in body and body[key]:
                val = body[key]
                if isinstance(val, str):
                    return val.strip().lower()
        return None

    def _resolve_source(self) -> Source:
        source, _ = Source.objects.get_or_create(
            slug=self.source_type.lower().strip(),
            defaults={"name": self.source_type.title()},
        )
        return source

    def _safe_str(self, value, max_length=None) -> str:
        if value is None: return ""
        if isinstance(value, (dict, list)):
            import json
            val_str = json.dumps(value, ensure_ascii=False)
        else:
            val_str = str(value).strip()
        if max_length and len(val_str) > max_length:
            return val_str[:max_length]
        return val_str

    def _extract_lead_data(self) -> dict:
        body = self.webhook_log.edited_body or self.raw_body
        return {
            "first_name": self._safe_str(body.get("first_name", body.get("nombre", "")), 150),
            "last_name": self._safe_str(body.get("last_name", body.get("apellido", "")), 150),
            "phone": self._safe_str(body.get("phone", body.get("telefono", body.get("tel", ""))), 50),
            "address": self._safe_str(body.get("address", body.get("direccion", ""))),
            "company": self._safe_str(body.get("company", body.get("empresa", "")), 200),
            "investment_goal": self._safe_str(body.get("investment_goal", ""), 100),
            "investment_capacity": self._safe_str(body.get("investment_capacity", ""), 100),
        }

    def _upsert_lead(self, email: str, source: Source, data: dict):
        try:
            with transaction.atomic():
                lead = (
                    Lead.objects
                    .select_for_update()
                    .filter(Q(original_email=email) | Q(contact_email=email))
                    .first()
                )

                if lead:
                    self._sync_fields(lead, data)
                    lead.save()
                else:
                    lead = Lead.objects.create(
                        original_email=email,
                        contact_email=email,
                        first_source=source,
                        **{k: v for k, v in data.items() if v},
                    )
                    LeadDistributionService.assign(lead)
                    if getattr(lead, 'score', 0) >= 70:
                        async_task('leads.tasks.task_send_welcome_email', str(lead.id))

                interaction = Interaction.objects.create(
                    lead=lead,
                    source=source,
                    raw_payload=self.raw_body,
                )
                return lead, interaction
        except IntegrityError:
            lead = Lead.objects.get(original_email=email)
            interaction = Interaction.objects.create(lead=lead, source=source, raw_payload=self.raw_body)
            return lead, interaction

    def _sync_fields(self, lead: Lead, data: dict):
        for field in self.SYNC_FIELDS:
            new_value = data.get(field, "")
            if new_value:
                setattr(lead, field, new_value)

class ReprocessWebhook:
    """
    Servicio para re-ejecutar un webhook que falló.
    """
    @staticmethod
    def reprocess(webhook_log: WebhookLog, edited_body: dict = None, user=None) -> WebhookLog:
        if edited_body:
            webhook_log.edited_body = edited_body
        webhook_log.edited_by = user
        webhook_log.status = WebhookLog.Status.PENDING
        webhook_log.error_message = ""
        webhook_log.save()

        body_to_process = webhook_log.edited_body if webhook_log.edited_body else webhook_log.raw_body
        processor = WebhookProcessor(source_type=webhook_log.source_type, raw_body=body_to_process)
        processor.webhook_log = webhook_log
        return processor.process()

    @staticmethod
    def bulk_reprocess(log_ids: list, user=None) -> dict:
        results = {"success": 0, "failed": 0}
        logs = WebhookLog.objects.filter(id__in=log_ids)
        for log in logs:
            try:
                ReprocessWebhook.reprocess(log, user=user)
                results["success"] += 1
            except Exception:
                results["failed"] += 1
        return results
