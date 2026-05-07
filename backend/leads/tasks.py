import logging
from .models import WebhookLog, Lead
from django.contrib.auth.models import User
from .services import WebhookProcessor
from .emails import send_welcome_email, send_vendor_alert_email

logger = logging.getLogger(__name__)

def process_webhook_task(log_id):
    """
    Tarea asíncrona de Django-Q para procesar un webhook.
    Se extrae el log de la BD y se re-hidrata el WebhookProcessor.
    """
    try:
        log = WebhookLog.objects.get(id=log_id)
    except WebhookLog.DoesNotExist:
        logger.error(f"WebhookLog {log_id} no encontrado en tarea asíncrona.")
        return

    # Si ya fue procesado, no lo procesamos de nuevo
    if log.status != WebhookLog.Status.PENDING:
        logger.info(f"WebhookLog {log_id} ya fue procesado ({log.status}). Ignorando.")
        return

    processor = WebhookProcessor(source_type=log.source_type, raw_body=log.raw_body)
    processor.webhook_log = log
    
    logger.info(f"Procesando asíncronamente WebhookLog {log_id}")
    processor.process()


def task_send_welcome_email(lead_id: str):
    """Tarea asíncrona para enviar correo de bienvenida."""
    try:
        lead = Lead.objects.get(id=lead_id)
        if lead.contact_email:
            send_welcome_email(
                lead_email=lead.contact_email,
                first_name=lead.first_name,
                lead_id=str(lead.id)
            )
        else:
            logger.warning(f"No contact email found for lead {lead_id} to send welcome email.")
    except Lead.DoesNotExist:
        logger.error(f"Lead {lead_id} not found for welcome email.")
    except Exception as e:
        logger.error(f"Error in task_send_welcome_email: {e}")


def task_send_vendor_alert(lead_id: str, vendor_id: int):
    """Tarea asíncrona para notificar al vendedor sobre un nuevo lead."""
    try:
        lead = Lead.objects.select_related('campaign').get(id=lead_id)
        vendor = User.objects.get(id=vendor_id)
        
        if vendor.email:
            lead_data = {
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "original_email": lead.original_email,
                "phone": lead.phone,
                "score": lead.score,
                "campaign_name": lead.campaign.name if lead.campaign else None
            }
            
            send_vendor_alert_email(
                vendor_email=vendor.email,
                vendor_name=vendor.first_name or vendor.username,
                lead_data=lead_data,
                lead_id=str(lead.id)
            )
        else:
            logger.warning(f"Vendor {vendor.username} has no email configured.")
    except (Lead.DoesNotExist, User.DoesNotExist):
        logger.error(f"Lead {lead_id} or Vendor {vendor_id} not found for alert email.")
    except Exception as e:
        logger.error(f"Error in task_send_vendor_alert: {e}")
