import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from leads.models import VendorProfile

def sync_accounts():
    users_to_fix = ['admin', 'maria', 'carlos', 'ana']
    print("--- REPARACIÃ“N DE CREDENCIALES ---")
    for username in users_to_fix:
        try:
            u = User.objects.get(username=username)
            u.set_password('123')
            u.is_active = True
            u.save()
            
            # Asegurar que tiene perfil de vendedor
            VendorProfile.objects.get_or_create(user=u)
            
            print(f"USUARIO: {username} | PASSWORD: 123 | PERFIL: OK | ESTADO: LISTO")
        except User.DoesNotExist:
            print(f"USUARIO: {username} | ERROR: No existe. Saltando...")

if __name__ == "__main__":
    sync_accounts()
