import requests
import json

URL = "http://localhost:8000/api/v1/webhooks/receive/"

scenarios = [
    {
        "name": "Sin Email",
        "payload": {"usuario": "Pedro", "msg": "Hola"}
    },
    {
        "name": "Nombre Gigante",
        "payload": {"email": "long@test.com", "first_name": "A" * 1000}
    },
    {
        "name": "Datos Anidados",
        "payload": {"email": "nested@test.com", "phone": {"oficina": "123", "casa": "456"}}
    },
    {
        "name": "Payload Vacío",
        "payload": {}
    },
    {
        "name": "Lista en vez de Objeto",
        "payload": [{"email": "list@test.com"}]
    }
]

for s in scenarios:
    print(f"[*] Probando escenario: {s['name']}")
    try:
        response = requests.post(URL, json=s['payload'])
        print(f"    Status: {response.status_code}")
        print(f"    Response: {response.json()}")
    except Exception as e:
        print(f"    Error: {e}")
    print("-" * 30)
