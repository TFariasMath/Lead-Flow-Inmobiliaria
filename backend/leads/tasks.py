import logging
from .models import WebhookLog
from .services import WebhookProcessor

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
