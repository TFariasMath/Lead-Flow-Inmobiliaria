"""
Lead Flow - Test de Seguridad a Nivel de Fila (RLS)
==================================================
Este script valida que las restricciones de seguridad del API funcionen:
- Los Administradores deben ver TODOS los leads.
- Los Vendedores solo deben ver sus propios leads asignados.
"""

import requests

# Configuración del servidor local
API_URL = "http://localhost:8000/api/v1"

def login(username, password):
    """Obtiene un Access Token JWT para un usuario específico."""
    r = requests.post(f"{API_URL}/auth/token/", json={"username": username, "password": password})
    if r.status_code == 200:
        return r.json()["access"]
    print(f"Error de Login para '{username}': {r.json()}")
    return None

def get_leads(token):
    """Consulta el listado de leads usando un token de portador (Bearer)."""
    r = requests.get(f"{API_URL}/leads/", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        return r.json()
    print(f"Error al obtener leads: Status {r.status_code}")
    return None

print("--- Iniciando Auditoría de Permisos (API Security) ---")

# 1. Test Admin: Visibilidad Total
admin_token = login("admin", "admin123")
if admin_token:
    admin_leads = get_leads(admin_token)
    print(f"[*] ADMIN: Tiene acceso a {admin_leads['count']} leads (Visibilidad Global).")

# 2. Test Vendedor: Visibilidad Restringida
# Nota: Asegúrate de que estas credenciales existan en tu base de datos local.
v1_token = login("vendedor1", "admin123") # Asumiendo password reseteado
if v1_token:
    v1_leads = get_leads(v1_token)
    print(f"[*] VENDEDOR1: Solo tiene acceso a {v1_leads['count']} leads (Solo asignados).")

print("\n[*] Prueba de Row-Level Security finalizada.")
print("Si el conteo de VENDEDOR1 es menor al de ADMIN, la seguridad está activa.")
