import os
import django
import requests
import time

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import WebhookLog, Lead
from django.contrib.auth.models import User

def test_round_robin():
    print("--- Test de Round Robin ---")
    results = []
    
    # 1. Enviar 3 leads seguidos
    for i in range(3):
        email = f"rr_test_{int(time.time())}_{i}@example.com"
        payload = {
            "source_type": "rr_test",
            "data": {"email": email, "first_name": f"Lead RR {i}"}
        }
        print(f"Enviando lead {i+1}/3 ({email})...")
        requests.post("http://127.0.0.1:8000/api/v1/webhooks/receive/", json=payload)
        time.sleep(1) # Pequeña pausa para asegurar orden

    print("Esperando procesamiento (8s)...")
    time.sleep(8)

    # 2. Verificar asignaciones
    recent_leads = Lead.objects.filter(original_email__startswith="rr_test_").order_by('-created_at')[:3]
    
    for lead in reversed(recent_leads):
        vendor = lead.assigned_to.username if lead.assigned_to else "SIN ASIGNAR"
        results.append(vendor)
        print(f"Lead: {lead.original_email} -> Asignado a: {vendor}")

    if len(set(results)) > 1:
        print("\n✅ ÉXITO: El Round Robin está rotando los leads.")
    else:
        print("\n❌ FALLO: Los leads quedaron en el mismo vendedor o no se asignaron.")

if __name__ == "__main__":
    test_round_robin()
