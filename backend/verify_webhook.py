import os
import django
import requests
import time

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import WebhookLog, Lead

def test_webhook_connection():
    email = f"test_robustness_{int(time.time())}@example.com"
    payload = {
        "source_type": "test_generator",
        "data": {
            "email": email,
            "first_name": "Usuario",
            "last_name": "Prueba"
        }
    }
    
    print(f"Enviando webhook para {email}...")
    response = requests.post("http://127.0.0.1:8000/api/v1/webhooks/receive/", json=payload)
    
    if response.status_code == 200:
        log_id = response.json().get("webhook_log_id")
        print(f"Respuesta OK (200). WebhookLog ID: {log_id}")
        
        # Esperar un poco a que el worker procese
        print("Esperando procesamiento asíncrono (5s)...")
        time.sleep(5)
        
        try:
            log = WebhookLog.objects.get(id=log_id)
            print(f"Log encontrado en DB. Status real: '{log.status}', Lead ID: {log.lead_id}")
            
            if log.status == WebhookLog.Status.SUCCESS and log.lead:
                print(f"ÉXITO: El log está vinculado al Lead ID: {log.lead.id}")
                print(f"Lead Email: {log.lead.original_email}")
                return True
            else:
                print(f"FALLO: El log no se procesó correctamente o no tiene Lead vinculado. Status: {log.status}")
                if log.error_message:
                    print(f"Error: {log.error_message}")
        except WebhookLog.DoesNotExist:
            print("FALLO: No se encontró el WebhookLog en la base de datos.")
    else:
        print(f"FALLO: El endpoint respondió con error {response.status_code}")
        print(response.text)
    
    return False

if __name__ == "__main__":
    test_webhook_connection()
