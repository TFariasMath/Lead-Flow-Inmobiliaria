import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

def check_users():
    users_to_check = ['admin', 'maria', 'carlos', 'ana']
    print("--- DIAGNÃ“STICO DE USUARIOS ---")
    for username in users_to_check:
        try:
            u = User.objects.get(username=username)
            status = "ACTIVO" if u.is_active else "INACTIVO"
            is_staff = "STAFF" if u.is_staff else "VENDEDOR"
            print(f"USUARIO: {username} | ESTADO: {status} | TIPO: {is_staff} | ID: {u.id}")
            
            # Si estÃ¡ inactivo, lo activamos
            if not u.is_active:
                u.is_active = True
                u.save()
                print(f"  [!] Usuario {username} reactivado forzosamente.")
                
        except User.DoesNotExist:
            print(f"USUARIO: {username} | ERROR: No existe en la base de datos.")

if __name__ == "__main__":
    check_users()
