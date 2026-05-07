"""
Lead Flow - Email Backend
=========================
Controlador personalizado para la salida de correos electrónicos.
En lugar de enviar un SMTP real (que puede costar dinero o ser bloqueado),
este backend intercepta el correo y lo guarda en nuestra base de datos.

Beneficios:
- Historial completo: El vendedor puede ver qué correos ha recibido el cliente.
- Timeline: Se crea una interacción automática cuando se 'envía' un correo.
- Sandbox: Ideal para pruebas sin molestar a clientes reales.
"""

from django.core.mail.backends.base import BaseEmailBackend
from .models import SentEmail, Lead, Interaction
import logging

# Logger para trazabilidad de envíos
logger = logging.getLogger(__name__)

class DatabaseEmailBackend(BaseEmailBackend):
    """
    Simulador de servidor de correo que persiste los mensajes en SentEmail.
    """
    
    def send_messages(self, email_messages):
        """
        Punto de entrada de Django cuando alguien llama a 'send_mail'.
        """
        if not email_messages:
            return 0
        
        sent_count = 0
        for message in email_messages:
            try:
                # 1. Identificar destinatarios
                to_emails = message.to
                if not to_emails:
                    logger.warning("Email sin destinatario ignorado.")
                    continue
                
                # Usamos el primer destinatario para vincularlo al Lead
                primary_to = to_emails[0]
                
                # 2. Búsqueda Inteligente del Lead: 
                # Intentamos asociar el correo a un prospecto por su email original o de contacto.
                lead = Lead.objects.filter(original_email=primary_to.lower().strip()).first()
                if not lead:
                    lead = Lead.objects.filter(contact_email=primary_to.lower().strip()).first()

                # 3. Captura de Formato (Texto plano vs HTML)
                html_body = ""
                # Django guarda el HTML en 'alternatives'
                if hasattr(message, 'alternatives') and message.alternatives:
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_body = content
                            break

                # 4. Persistencia: Guardar el correo físicamente en la BD
                sent_email = SentEmail.objects.create(
                    lead=lead,
                    to_email=primary_to,
                    from_email=message.from_email,
                    subject=message.subject,
                    body_text=message.body,
                    body_html=html_body,
                    headers=getattr(message, 'extra_headers', {})
                )

                # 5. Integración con el CRM:
                # Si encontramos al lead, añadimos el envío al timeline del cliente.
                if lead:
                    Interaction.objects.create(
                        lead=lead,
                        type=Interaction.Type.EMAIL_SENT,
                        notes=f"Email automático enviado: {message.subject}",
                        raw_payload={
                            "sent_email_id": str(sent_email.id),
                            "subject": message.subject,
                            "from": message.from_email
                        }
                    )
                
                sent_count += 1
                logger.info(f"Email persistido exitosamente (ID: {sent_email.id})")

            except Exception as e:
                # Fallback: No detenemos el proceso si falla el guardado de un mail
                logger.error(f"Falla crítica en el envío simulado: {str(e)}")
        
        return sent_count
