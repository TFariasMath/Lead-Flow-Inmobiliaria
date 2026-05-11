import logging
from typing import Optional
from django.db import transaction, IntegrityError
from django.utils import timezone
from django_q.tasks import async_task
from django.db.models import Q

from dataclasses import dataclass, asdict, fields
from ..models import Lead, Source, Interaction, WebhookLog
from .distribution import LeadDistributionService

logger = logging.getLogger(__name__)

@dataclass
class ExtractedLeadData:
    """Estructura de datos formal para el transporte de leads extraídos."""
    first_name: str = ""
    last_name: str = ""
    phone: str = ""
    address: str = ""
    company: str = ""
    investment_goal: str = ""
    investment_capacity: str = ""

    def to_dict(self, exclude_empty=True):
        data = asdict(self)
        if exclude_empty:
            return {k: v for k, v in data.items() if v}
        return data

class WebhookProcessor:
    """
    Cerebro del sistema de captura. Se encarga de recibir basura (JSON crudo)
    y transformarla en un Lead calificado y asignado.
    """

    SYNC_FIELDS = [f.name for f in fields(ExtractedLeadData)]

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
        
        # Estrategias de extracción inteligente según la fuente
        # 1. Caso Calendly (Anidado en payload.invitee)
        if self.source_type == "calendly":
            invitee = body.get("payload", {}).get("invitee", {})
            if "email" in invitee: return invitee["email"].strip().lower()

        # 2. Caso Mailchimp (Anidado en merges)
        if self.source_type == "mailchimp":
            merges = body.get("merges", {})
            if "EMAIL" in merges: return merges["EMAIL"].strip().lower()

        # 3. Búsqueda genérica recursiva o por llaves comunes
        for key in ("email", "Email", "EMAIL", "correo", "mail", "contact_email"):
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

    def _extract_lead_data(self) -> ExtractedLeadData:
        body = self.webhook_log.edited_body or self.raw_body
        data = {}

        # Mapeo específico por fuente para máxima robustez
        if self.source_type == "calendly":
            invitee = body.get("payload", {}).get("invitee", {})
            data["first_name"] = invitee.get("first_name", "")
            data["last_name"] = invitee.get("last_name", "")
            data["phone"] = invitee.get("text_reminder_number", "")
        
        elif self.source_type == "mailchimp":
            merges = body.get("merges", {})
            data["first_name"] = merges.get("FNAME", "")
            data["last_name"] = merges.get("LNAME", "")
            data["phone"] = merges.get("PHONE", "")
            data["company"] = merges.get("COMPANY", "")

        # Extracción genérica
        first_name = data.get("first_name") or self._safe_str(body.get("first_name", body.get("nombre", body.get("FNAME", ""))), 150)
        last_name = data.get("last_name") or self._safe_str(body.get("last_name", body.get("apellido", body.get("LNAME", ""))), 150)
        phone = data.get("phone") or self._safe_str(body.get("phone", body.get("telefono", body.get("tel", body.get("PHONE", "")))), 50)
        address = self._safe_str(body.get("address", body.get("direccion", "")))
        company = data.get("company") or self._safe_str(body.get("company", body.get("empresa", "")), 200)
        investment_goal = self._safe_str(body.get("investment_goal", ""), 100)
        investment_capacity = self._safe_str(body.get("investment_capacity", ""), 100)
        
        return ExtractedLeadData(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            address=address,
            company=company,
            investment_goal=investment_goal,
            investment_capacity=investment_capacity
        )

    def _upsert_lead(self, email: str, source: Source, data: ExtractedLeadData):
        try:
            with transaction.atomic():
                lead = (
                    Lead.objects
                    .select_for_update()
                    .filter(Q(original_email=email) | Q(contact_email=email))
                    .first()
                )

                if lead:
                    is_dirty = self._sync_fields(lead, data)
                    if is_dirty:
                        lead.save()
                else:
                    lead = Lead.objects.create(
                        original_email=email,
                        contact_email=email,
                        first_source=source,
                        **data.to_dict(),
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

    def _sync_fields(self, lead: Lead, data: ExtractedLeadData) -> bool:
        """
        Sincroniza solo los campos que han cambiado.
        Retorna True si el lead fue modificado (dirty).
        """
        is_dirty = False
        new_data = data.to_dict()
        for field in self.SYNC_FIELDS:
            new_value = new_data.get(field, "")
            current_value = getattr(lead, field, "")
            
            if new_value and new_value != current_value:
                setattr(lead, field, new_value)
                is_dirty = True
        return is_dirty

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
