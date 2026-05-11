import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_password_change():
    print("--- Test: Cambio de Contraseña via API ---")
    
    # 1. Login como admin para obtener token
    print("Iniciando sesión como admin...")
    login_res = requests.post(f"{BASE_URL}/auth/token/", json={
        "username": "admin",
        "password": "123"
    })
    
    if login_res.status_code != 200:
        print(f"Error login admin: {login_res.text}")
        return
    
    token = login_res.json()["access"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Buscar un usuario de prueba (ej: carlos)
    print("Buscando usuario de prueba 'carlos'...")
    users_res = requests.get(f"{BASE_URL}/users/", headers=headers)
    
    if users_res.status_code != 200:
        print(f"Error al obtener usuarios ({users_res.status_code}): {users_res.text}")
        return
    
    try:
        users = users_res.json()
    except Exception as e:
        print(f"Error al decodificar JSON de usuarios: {e}")
        print(f"Contenido: {users_res.text}")
        return
    carlos = next((u for u in users if u["username"] == "carlos"), None)
    
    if not carlos:
        print("Usuario 'carlos' no encontrado. Asegúrate de haber corrido seed_data.")
        return
    
    user_id = carlos["id"]
    new_password = "new_password_123"
    
    # 3. Cambiar contraseña
    print(f"Cambiando contraseña de 'carlos' (ID: {user_id}) a '{new_password}'...")
    update_res = requests.patch(f"{BASE_URL}/users/{user_id}/", 
        json={"password": new_password}, 
        headers=headers
    )
    
    if update_res.status_code != 200:
        print(f"Error al actualizar: {update_res.text}")
        return
    
    print("Contraseña actualizada exitosamente.")
    
    # 4. Verificar login con nueva contraseña
    print("Verificando login con la nueva contraseña...")
    verify_res = requests.post(f"{BASE_URL}/auth/token/", json={
        "username": "carlos",
        "password": new_password
    })
    
    if verify_res.status_code == 200:
        print("EXITO: Login con nueva contrasena funciono (Backend esta hasheando correctamente).")
    else:
        print(f"FALLO: No se pudo iniciar sesion con la nueva contrasena: {verify_res.text}")
        
    # 5. Restaurar contraseña original para no romper otros tests
    print("Restaurando contraseña original '123'...")
    requests.patch(f"{BASE_URL}/users/{user_id}/", 
        json={"password": "123"}, 
        headers=headers
    )
    print("Prueba finalizada.")

if __name__ == "__main__":
    test_password_change()
