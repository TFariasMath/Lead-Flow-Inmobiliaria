"""
Lead Flow - Asynchronous Tasks
==============================
Tareas procesadas en segundo plano por el worker de Django Q.
Aquí se manejan las operaciones que podrían retrasar la respuesta al usuario:
- Procesamiento pesado de webhooks.
- Envío de correos electrónicos.
"""

import logging
from .models import WebhookLog, Lead
from django.contrib.auth.models import User
from .services import WebhookProcessor
from .emails import send_welcome_email, send_vendor_alert_email

# Logger para monitorear el worker desde los logs del sistema
logger = logging.getLogger(__name__)


def process_webhook_task(log_id):
    """
    Tarea de ingesta asíncrona.
    Se dispara inmediatamente después de recibir un POST en el webhook.
    """
    try:
        # Recuperamos el log que se guardó en la vista (api.py)
        log = WebhookLog.objects.get(id=log_id)
    except WebhookLog.DoesNotExist:
        logger.error(f"Falla Crítica: WebhookLog {log_id} no existe.")
        return

    # Evitamos procesar dos veces el mismo registro
    if log.status != WebhookLog.Status.PENDING:
        logger.info(f"Salto: WebhookLog {log_id} ya está procesado.")
        return

    # Invocamos al procesador de servicios para hacer el trabajo sucio (Upsert)
    processor = WebhookProcessor(source_type=log.source_type, raw_body=log.raw_body)
    processor.webhook_log = log
    
    logger.info(f"Iniciando procesamiento de WebhookLog {log_id}...")
    processor.process()


def task_send_welcome_email(lead_id: str):
    """
    Nurturing: Envía un correo automático al prospecto.
    """
    try:
        lead = Lead.objects.get(id=lead_id)
        if lead.contact_email:
            # Llama al motor de emails personalizado
            send_welcome_email(
                lead_email=lead.contact_email,
                first_name=lead.first_name,
                lead_id=str(lead.id)
            )
        else:
            logger.warning(f"Lead {lead_id} no tiene email para bienvenida.")
    except Lead.DoesNotExist:
        logger.error(f"Lead {lead_id} no encontrado para envío de bienvenida.")
    except Exception as e:
        logger.error(f"Error en task_send_welcome_email: {e}")


def task_send_vendor_alert(lead_id: str, vendor_id: int):
    """
    Alerta: Notifica al vendedor que tiene un nuevo lead asignado.
    """
    try:
        # Cargamos los datos necesarios para el cuerpo del correo
        lead = Lead.objects.select_related('campaign').get(id=lead_id)
        vendor = User.objects.get(id=vendor_id)
        
        if vendor.email:
            # Diccionario con la info que el vendedor necesita ver rápido
            lead_data = {
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "original_email": lead.original_email,
                "phone": lead.phone,
                "score": lead.score,
                "campaign_name": lead.campaign.name if lead.campaign else "Orgánico"
            }
            
            # Llama al motor de emails para enviar la alerta
            send_vendor_alert_email(
                vendor_email=vendor.email,
                vendor_name=vendor.first_name or vendor.username,
                lead_data=lead_data,
                lead_id=str(lead.id)
            )
        else:
            logger.warning(f"Vendedor {vendor.username} no tiene email configurado.")
    except (Lead.DoesNotExist, User.DoesNotExist):
        logger.error(f"Error: Lead o Vendedor no existen para la alerta.")
    except Exception as e:
        logger.error(f"Error en task_send_vendor_alert: {e}")
