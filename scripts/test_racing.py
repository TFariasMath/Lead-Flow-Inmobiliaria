"""
Lead Flow - Webhook Racing Test
===============================
Prueba la condición de carrera disparando webhooks simultáneos 
con el mismo correo electrónico.
"""
import threading
import requests
import json
import uuid

API_URL = "http://localhost:8000/api/v1/webhooks/receive/"
TEST_EMAIL = f"racer_{uuid.uuid4().hex[:6]}@racing.test"

def fire_webhook(source_name, identifier):
    payload = {
        "source_type": source_name,
        "data": {
            "email": TEST_EMAIL,
            "first_name": f"Test {identifier}",
            "phone": f"555-000-{identifier}"
        }
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=5)
        print(f"[{identifier}] Status: {response.status_code} | Respuesta: {response.json()}")
    except Exception as e:
        print(f"[{identifier}] Error: {e}")

print(f"[*] Iniciando Webhook Racing Test para el email: {TEST_EMAIL}")
print("Disparando 10 webhooks concurrentemente...")

threads = []
for i in range(10):
    source = "web" if i % 2 == 0 else "calendly"
    t = threading.Thread(target=fire_webhook, args=(source, i))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print("[*] Test finalizado. Verifica en la base de datos si se creo solo 1 Lead y 10 interacciones.")
