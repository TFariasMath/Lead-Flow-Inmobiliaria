import os
import django
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import argparse

# Configurar el entorno de Django para el script independiente
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lab_config.settings')
django.setup()

def send_test(template_name, to_email):
    print(f"🚀 Iniciando envío de prueba: {template_name} -> {to_email}")
    
    # Datos de prueba (Simulando un Lead real)
    context = {
        "welcome": {
            "first_name": "Juan Pérez",
            "brochure_url": "https://leadflow.com/demo-brochure"
        },
        "vendor_alert": {
            "vendor_name": "Asesor Premium",
            "lead_name": "María García",
            "phone": "+1 234 567 890",
            "email": "maria@interesada.com",
            "score": 95,
            "campaign": "Campaña Facebook Verano",
            "crm_url": "https://leadflow-crm.com/leads/123"
        }
    }
    
    subjects = {
        "welcome": "¡Bienvenido! Prueba desde el Lab",
        "vendor_alert": "🚨 ALERTA: Nuevo Lead (Prueba Lab)"
    }
    
    file_name = f"{template_name}.html"
    subject = subjects.get(template_name, "Correo de Prueba")
    data = context.get(template_name, {})
    
    try:
        # Renderizar HTML
        html_content = render_to_string(file_name, data)
        text_content = strip_tags(html_content)
        
        # Crear mensaje
        from_email = os.getenv('DEFAULT_FROM_EMAIL', 'tester@leadflow.com')
        msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
        msg.attach_alternative(html_content, "text/html")
        
        # Enviar
        msg.send()
        print(f"✅ ¡Correo enviado con éxito! Revisa tu bandeja de entrada.")
        
        if os.getenv('EMAIL_HOST_USER') == '':
            print("⚠️ NOTA: Como no hay EMAIL_HOST_USER en el .env, el correo se imprimió en la CONSOLA (modo debug).")
            
    except Exception as e:
        print(f"❌ Error al enviar: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Lead Flow Messaging Lab - Email Tester')
    parser.add_argument('--template', choices=['welcome', 'vendor_alert'], required=True, help='Plantilla a enviar')
    parser.add_argument('--to', required=True, help='Email del destinatario')
    
    args = parser.parse_args()
    send_test(args.template, args.to)
