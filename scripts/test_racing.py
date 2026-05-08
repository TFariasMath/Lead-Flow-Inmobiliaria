"""
Lead Flow - Webhook Racing Test (Prueba de Estrés)
=================================================
Este script simula un escenario de alta concurrencia disparando múltiples 
peticiones simultáneas al servidor con el mismo correo electrónico.

Objetivo:
- Verificar que el bloqueo de base de datos (select_for_update) en 
  WebhookProcessor funcione correctamente.
- Confirmar que solo se cree UN lead, evitando duplicados.
"""

import threading
import requests
import json
import uuid

# URL del servidor local
API_URL = "http://localhost:8000/api/v1/webhooks/receive/"

# Generamos un email aleatorio para cada ejecución del test
TEST_EMAIL = f"racer_{uuid.uuid4().hex[:6]}@racing.test"

def fire_webhook(source_name, identifier):
    """Envía una petición POST simulando una fuente externa."""
    payload = {
        "source_type": source_name,
        "data": {
            "email": TEST_EMAIL,
            "first_name": f"Test {identifier}",
            "phone": f"555-000-{identifier}"
        }
    }
    
    try:
        # Petición síncrona
        response = requests.post(API_URL, json=payload, timeout=5)
        print(f"[{identifier}] Status: {response.status_code} | Respuesta: {response.json()}")
    except Exception as e:
        print(f"[{identifier}] Error en el hilo {identifier}: {e}")

print(f"[*] Iniciando Webhook Racing Test para: {TEST_EMAIL}")
print("Lanzando 10 hilos concurrentes...")

# Creación de hilos para ejecución en paralelo
threads = []
for i in range(10):
    # Alternamos fuentes para simular diferentes orígenes
    source = "facebook" if i % 2 == 0 else "landing-page"
    t = threading.Thread(target=fire_webhook, args=(source, i))
    threads.append(t)
    t.start()

# Esperar a que todos los hilos terminen
for t in threads:
    t.join()

print("\n[*] Test finalizado.")
print("RESULTADO ESPERADO: 1 Lead creado en DB y 10 Interacciones en su Timeline.")
