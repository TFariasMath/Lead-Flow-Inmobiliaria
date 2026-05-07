"""
Lead Flow - Email System
========================
Maneja la composición y el envío de correos electrónicos.
Utiliza el formato HTML con estilos integrados (inline) para garantizar 
la compatibilidad con clientes de correo (Outlook, Gmail).
"""

import logging
from django.core.mail import EmailMultiAlternatives # Permite enviar texto plano + HTML
from django.conf import settings                    # Para acceder a DEFAULT_FROM_EMAIL
from django.template.loader import render_to_string # (Opcional) Para usar archivos .html
from django.utils.html import strip_tags           # Convierte HTML a texto plano

# Logger para monitorear el estado de los envíos
logger = logging.getLogger(__name__)

# ─── Plantillas Integradas (Fallback) ─────────────────────────────────────────

# Diseño del correo de bienvenida para el cliente
WELCOME_HTML = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; color: #1e293b; line-height: 1.6; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #0f172a; padding: 25px; text-align: center; border-radius: 12px 12px 0 0; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; }}
        .content {{ background-color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }}
        .btn {{ display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 25px; }}
        .footer {{ text-align: center; margin-top: 25px; font-size: 13px; color: #64748b; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a Lead Flow!</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{first_name}</strong>,</p>
            <p>Es un gusto saludarte. Hemos recibido tus datos correctamente y un asesor especializado te contactará en breve.</p>
            <p>Para que vayas conociendo nuestras opciones, hemos preparado un <strong>Brochure Personalizado</strong> exclusivamente para ti:</p>
            <div style="text-align: center;">
                <a href="{brochure_url}" class="btn">Ver mi Brochure PDF</a>
            </div>
            <p style="margin-top: 35px;">Si tienes dudas inmediatas, solo responde a este correo.</p>
            <p>Saludos,<br>El equipo comercial.</p>
        </div>
        <div class="footer">
            <p>Este es un mensaje automático de nuestro CRM.</p>
        </div>
    </div>
</body>
</html>
"""

# Diseño del correo de alerta para el vendedor
VENDOR_ALERT_HTML = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; color: #1e293b; line-height: 1.6; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #10b981; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 20px; }}
        .content {{ background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }}
        .data-table {{ width: 100%; border-collapse: collapse; margin-top: 25px; }}
        .data-table th {{ text-align: left; color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }}
        .data-table td {{ padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; }}
        .btn {{ display: inline-block; padding: 12px 24px; background-color: #1e293b; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 30px; }}
        .score {{ color: #10b981; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Nuevo Lead Recibido 🔥</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{vendor_name}</strong>,</p>
            <p>Tienes un nuevo prospecto esperando. ¡Contáctalo lo antes posible!</p>
            
            <table class="data-table">
                <tr><th>Nombre:</th><td>{lead_name}</td></tr>
                <tr><th>Teléfono:</th><td>{phone}</td></tr>
                <tr><th>Email:</th><td>{email}</td></tr>
                <tr><th>Score:</th><td class="score">{score} / 100</td></tr>
                <tr><th>Campaña:</th><td>{campaign}</td></tr>
            </table>

            <div style="text-align: center;">
                <a href="{crm_url}" class="btn">Gestionar en el CRM</a>
            </div>
        </div>
    </div>
</body>
</html>
"""

# ─── Funciones de Envío ──────────────────────────────────────────────────────

def send_welcome_email(lead_email: str, first_name: str, lead_id: str):
    """
    Envía el primer contacto al cliente.
    Incluye el enlace mágico para descargar el PDF.
    """
    subject = "¡Todo listo! Descarga tu información personalizada"
    
    # Construcción del enlace al endpoint de PDF
    brochure_url = f"http://localhost:8000/api/v1/leads/{lead_id}/brochure/"
    
    # Inyectar datos en la plantilla
    html_content = WELCOME_HTML.format(
        first_name=first_name or "inversionista",
        brochure_url=brochure_url
    )
    # Generar versión en texto plano para clientes antiguos
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
    Envía una notificación push por correo al vendedor asignado.
    """
    subject = f"🚨 Nuevo Lead: {lead_data.get('first_name', 'S/N')} (Score: {lead_data.get('score', 0)})"
    
    # Enlace directo al detalle del lead en el frontend (React/Next.js)
    crm_url = f"http://localhost:3000/dashboard/leads/{lead_id}"

    html_content = VENDOR_ALERT_HTML.format(
        vendor_name=vendor_name,
        lead_name=f"{lead_data.get('first_name', '')} {lead_data.get('last_name', '')}".strip() or lead_data.get('original_email', ''),
        phone=lead_data.get('phone', 'No disponible'),
        email=lead_data.get('original_email', 'No disponible'),
        score=lead_data.get('score', 0),
        campaign=lead_data.get('campaign_name', 'Búsqueda Orgánica'),
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
        logger.info(f"Alerta enviada al vendedor {vendor_email}")
    except Exception as e:
        logger.error(f"Error enviando alerta: {str(e)}")
