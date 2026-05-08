"""
Lead Flow - Email System
========================
Maneja la composición y el envío de correos electrónicos.
Las plantillas se encuentran en la carpeta compartida 'messaging-lab/templates'.
"""

import logging
from django.core.mail import EmailMultiAlternatives 
from django.conf import settings                    
from django.template.loader import render_to_string 
from django.utils.html import strip_tags           

logger = logging.getLogger(__name__)

# --- Funciones de Envío ------------------------------------------------------

def send_welcome_email(lead_email: str, first_name: str, lead_id: str):
    """
    Envía el primer contacto al cliente.
    """
    subject = "¡Todo listo! Descarga tu información personalizada"
    
    brochure_url = f"http://localhost:8000/api/v1/leads/{lead_id}/brochure/"
    
    context = {
        "first_name": first_name or "inversionista",
        "brochure_url": brochure_url
    }
    
    # Cargar plantilla desde messaging-lab/templates/welcome.html
    html_content = render_to_string("welcome.html", context)
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
        logger.info(f"Bienvenida enviada a {lead_email}")
    except Exception as e:
        logger.error(f"Error enviando bienvenida: {str(e)}")


def send_vendor_alert_email(vendor_email: str, vendor_name: str, lead_data: dict, lead_id: str):
    """
    Notifica al vendedor sobre un nuevo lead asignado.
    """
    subject = f"🚨 Nuevo Lead: {lead_data.get('first_name', 'S/N')} (Score: {lead_data.get('score', 0)})"
    
    crm_url = f"http://localhost:3000/dashboard/leads/{lead_id}"

    context = {
        "vendor_name": vendor_name,
        "lead_name": f"{lead_data.get('first_name', '')} {lead_data.get('last_name', '')}".strip() or lead_data.get('original_email', ''),
        "phone": lead_data.get('phone', 'No disponible'),
        "email": lead_data.get('original_email', 'No disponible'),
        "score": lead_data.get('score', 0),
        "campaign": lead_data.get('campaign_name', 'Búsqueda Orgánica'),
        "crm_url": crm_url
    }
    
    # Cargar plantilla desde messaging-lab/templates/vendor_alert.html
    html_content = render_to_string("vendor_alert.html", context)
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
        logger.info(f"Alerta enviada al vendedor {vendor_email}")
    except Exception as e:
        logger.error(f"Error enviando alerta: {str(e)}")
