import requests
import concurrent.futures
import time

URL = "http://localhost:8000/api/v1/webhooks/receive/"
TOTAL = 200
THREADS = 50

def send_one(i):
    payload = {
        "source_type": "stress_test",
        "email": f"heavy_stress_{i}_{int(time.time())}@test.com",
        "first_name": "Heavy",
        "last_name": "Stress"
    }
    try:
        r = requests.post(URL, json=payload, timeout=2) # Timeout corto para detectar saturación
        return r.status_code
    except Exception as e:
        return type(e).__name__

print(f"Iniciando ATAQUE PESADO de {TOTAL} webhooks con {THREADS} hilos...")
start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=THREADS) as executor:
    results = list(executor.map(send_one, range(TOTAL)))

duration = time.time() - start
success = results.count(200)
errors = [r for r in results if r != 200]

print(f"Terminado en {duration:.2f}s")
print(f"Exitosos: {success}/{TOTAL}")
if errors:
    print(f"Resumen de errores: {set(errors)}")
