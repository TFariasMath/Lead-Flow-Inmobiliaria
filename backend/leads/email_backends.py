from django.core.mail.backends.base import BaseEmailBackend
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from .models import SentEmail, Lead, Interaction
import logging

logger = logging.getLogger(__name__)

class DatabaseEmailBackend(BaseEmailBackend):
    """
    Email Backend que guarda los correos en la base de datos.
    Especialmente útil para desarrollo local (Sandbox) y para
    mantener un historial inmutable de comunicaciones.
    """
    
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        sent_count = 0
        for message in email_messages:
            try:
                # 1. Extraer datos del mensaje
                to_emails = message.to
                if not to_emails:
                    logger.warning("Intento de envío de email sin destinatarios.")
                    continue
                
                # Por simplicidad, tomamos el primer destinatario como clave
                primary_to = to_emails[0]
                
                # 2. Intentar vincular con un Lead existente
                lead = Lead.objects.filter(original_email=primary_to.lower().strip()).first()
                if not lead:
                    lead = Lead.objects.filter(contact_email=primary_to.lower().strip()).first()

                # 3. Extraer HTML si existe
                html_body = ""
                if hasattr(message, 'alternatives') and message.alternatives:
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_body = content
                            break

                # 4. Crear el registro en SentEmail
                sent_email = SentEmail.objects.create(
                    lead=lead,
                    to_email=primary_to,
                    from_email=message.from_email,
                    subject=message.subject,
                    body_text=message.body,
                    body_html=html_body,
                    headers=getattr(message, 'extra_headers', {})
                )

                # 5. Crear la Interacción en el Timeline del Lead si existe
                if lead:
                    Interaction.objects.create(
                        lead=lead,
                        type=Interaction.Type.EMAIL_SENT,
                        notes=f"Email enviado: {message.subject}",
                        raw_payload={
                            "sent_email_id": str(sent_email.id),
                            "subject": message.subject,
                            "from": message.from_email
                        }
                    )
                
                sent_count += 1
                logger.info(f"Email guardado en DB (ID: {sent_email.id}) para {primary_to}")

            except Exception as e:
                logger.error(f"Error crítico en DatabaseEmailBackend: {str(e)}")
                # En un backend de sandbox, no queremos que el error detenga la ejecución del worker,
                # pero en producción esto debería manejarse según la política de reintentos.
        
        return sent_count
