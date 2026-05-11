import requests
import concurrent.futures
import time

URL = "http://localhost:8000/api/v1/webhooks/receive/?source=Diagnostics"
TOTAL = 50
THREADS = 10

def send_one(i):
    payload = {
        "email": f"diag_{i}_{int(time.time())}@test.com",
        "first_name": "Diag",
        "last_name": str(i)
    }
    try:
        r = requests.post(URL, json=payload, timeout=5)
        return r.status_code
    except Exception as e:
        return str(e)

print(f"Iniciando envío de {TOTAL} webhooks con {THREADS} hilos...")
start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=THREADS) as executor:
    results = list(executor.map(send_one, range(TOTAL)))

duration = time.time() - start
success = results.count(200)
errors = [r for r in results if r != 200]

print(f"Terminado en {duration:.2f}s")
print(f"Exitosos: {success}/{TOTAL}")
if errors:
    print(f"Primeros 5 errores: {errors[:5]}")
