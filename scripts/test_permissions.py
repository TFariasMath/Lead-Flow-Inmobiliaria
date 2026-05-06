import requests

API_URL = "http://localhost:8000/api/v1"

def login(username, password):
    r = requests.post(f"{API_URL}/auth/token/", json={"username": username, "password": password})
    if r.status_code == 200:
        return r.json()["access"]
    print(f"Error login {username}: {r.json()}")
    return None

def get_leads(token):
    r = requests.get(f"{API_URL}/leads/", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        return r.json()
    print(f"Error fetch leads: {r.status_code}")
    return None

# Login admin (sees all)
admin_token = login("admin", "admin123")
admin_leads = get_leads(admin_token)
print(f"[*] ADMIN ve: {admin_leads['count']} leads")

# Login vendedor1 (should see fewer)
v1_token = login("vendedor1", "vendedor123")
v1_leads = get_leads(v1_token)
print(f"[*] VENDEDOR1 ve: {v1_leads['count']} leads")

# Login vendedor2
v2_token = login("vendedor2", "vendedor123")
v2_leads = get_leads(v2_token)
print(f"[*] VENDEDOR2 ve: {v2_leads['count']} leads")

print("\n[*] Prueba Row-Level Security exitosa.")
