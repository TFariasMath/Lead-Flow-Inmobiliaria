import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

# Fallback HTML strings in case templates aren't created yet
WELCOME_HTML = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .header h1 {{ color: #fff; margin: 0; font-size: 24px; }}
        .content {{ background-color: #f8fafc; padding: 30px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }}
        .btn {{ display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Gracias por tu interés!</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{first_name}</strong>,</p>
            <p>Hemos recibido tus datos y uno de nuestros asesores expertos se pondrá en contacto contigo muy pronto para brindarte toda la información que necesitas.</p>
            <p>Mientras tanto, puedes revisar nuestro brochure exclusivo de propiedades destacadas haciendo clic en el botón de abajo:</p>
            <div style="text-align: center;">
                <a href="#" class="btn">Descargar Brochure</a>
            </div>
            <p style="margin-top: 30px;">Si tienes alguna urgencia, puedes responder directamente a este correo.</p>
            <p>Saludos cordiales,<br>El equipo de CRM Inmobiliaria.</p>
        </div>
        <div class="footer">
            <p>Este es un correo automático, por favor no respondas a esta dirección si no es necesario.</p>
        </div>
    </div>
</body>
</html>
"""

VENDOR_ALERT_HTML = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #10b981; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .header h1 {{ color: #fff; margin: 0; font-size: 20px; }}
        .content {{ background-color: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        .data-table th, .data-table td {{ padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: left; }}
        .data-table th {{ width: 30%; color: #475569; font-weight: 600; }}
        .btn {{ display: inline-block; padding: 10px 20px; background-color: #1e293b; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }}
        .high-score {{ color: #10b981; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Nuevo Lead Asignado!</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{vendor_name}</strong>,</p>
            <p>Se te ha asignado un nuevo lead. Te recomendamos contactarlo en los próximos <strong>5 minutos</strong> para maximizar las probabilidades de conversión.</p>
            
            <table class="data-table">
                <tr><th>Nombre:</th><td>{lead_name}</td></tr>
                <tr><th>Teléfono:</th><td>{phone}</td></tr>
                <tr><th>Email:</th><td>{email}</td></tr>
                <tr><th>Score:</th><td class="high-score">{score}/100</td></tr>
                <tr><th>Campaña:</th><td>{campaign}</td></tr>
            </table>

            <div style="text-align: center;">
                <a href="{crm_url}" class="btn">Ver en el CRM</a>
            </div>
        </div>
    </div>
</body>
</html>
"""

def send_welcome_email(lead_email: str, first_name: str):
    """Envía el correo de bienvenida al cliente."""
    subject = "¡Gracias por tu interés! - Descarga tu Brochure"
    
    # Preparar el HTML
    html_content = WELCOME_HTML.format(
        first_name=first_name or "futuro propietario"
    )
    text_content = strip_tags(html_content)

    msg = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [lead_email]
    )
    msg.attach_alternative(html_content, "text/html")
    
    try:
        msg.send()
        logger.info(f"Correo de bienvenida enviado a: {lead_email}")
    except Exception as e:
        logger.error(f"Error al enviar correo de bienvenida a {lead_email}: {str(e)}")


def send_vendor_alert_email(vendor_email: str, vendor_name: str, lead_data: dict, lead_id: str):
    """Envía una alerta inmediata al vendedor cuando se le asigna un lead."""
    subject = f"Nuevo Lead Asignado: {lead_data.get('first_name', '')} (Score: {lead_data.get('score', 0)})"
    
    # Construir URL temporal (esto luego puede salir de las settings)
    crm_url = f"http://localhost:3000/dashboard/leads/{lead_id}"

    html_content = VENDOR_ALERT_HTML.format(
        vendor_name=vendor_name,
        lead_name=f"{lead_data.get('first_name', '')} {lead_data.get('last_name', '')}".strip() or lead_data.get('original_email', ''),
        phone=lead_data.get('phone', 'No especificado'),
        email=lead_data.get('original_email', 'No especificado'),
        score=lead_data.get('score', 0),
        campaign=lead_data.get('campaign_name', 'Orgánico / Sin Campaña'),
        crm_url=crm_url
    )
    text_content = strip_tags(html_content)

    msg = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [vendor_email]
    )
    msg.attach_alternative(html_content, "text/html")
    
    try:
        msg.send()
        logger.info(f"Alerta de asignación enviada al vendedor: {vendor_email}")
    except Exception as e:
        logger.error(f"Error al enviar alerta a vendedor {vendor_email}: {str(e)}")
