import requests
import time
import concurrent.futures
import uuid

URL = "http://localhost:8000/api/v1/webhooks/receive/"
TOTAL_REQUESTS = 100
CONCURRENT_THREADS = 10  # Ajustable según la capacidad local

def send_webhook(i):
    payload = {
        "email": f"load_test_{i}_{uuid.uuid4().hex[:6]}@test.com",
        "first_name": f"User {i}",
        "source": "load_test_tool"
    }
    start = time.time()
    try:
        response = requests.post(URL, json=payload, timeout=5)
        duration = time.time() - start
        return response.status_code, duration
    except Exception as e:
        return 500, time.time() - start

def run_load_test():
    print(f"[*] Iniciando Prueba de Carga: {TOTAL_REQUESTS} peticiones con {CONCURRENT_THREADS} hilos...")
    
    start_time = time.time()
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_THREADS) as executor:
        futures = [executor.submit(send_webhook, i) for i in range(TOTAL_REQUESTS)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            
    total_duration = time.time() - start_time
    
    # Análisis de resultados
    status_codes = [r[0] for r in results]
    durations = [r[1] for r in results]
    
    success_count = status_codes.count(200)
    avg_duration = sum(durations) / len(durations)
    
    print("\n" + "="*30)
    print("RESULTADOS DE CARGA (API)")
    print("="*30)
    print(f"Peticiones Totales: {TOTAL_REQUESTS}")
    print(f"Exitosas (200 OK): {success_count}")
    print(f"Fallidas: {TOTAL_REQUESTS - success_count}")
    print(f"Tiempo Total de Ráfaga: {total_duration:.2f} segundos")
    print(f"Promedio de Respuesta: {avg_duration*1000:.2f} ms")
    print(f"Throughput: {TOTAL_REQUESTS / total_duration:.2f} req/sec")
    print("="*30)

if __name__ == "__main__":
    run_load_test()
