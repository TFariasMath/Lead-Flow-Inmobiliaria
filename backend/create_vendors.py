
from django.contrib.auth.models import User, Group
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def create_vendors():
    try:
        vendedor_group = Group.objects.get(name='Vendedor')
    except Group.DoesNotExist:
        print("El grupo 'Vendedor' no existe. Ejecuta primero la semilla de roles.")
        return

    users_data = [
        ('maria', 'maria@leadflow.com'),
        ('carlos', 'carlos@leadflow.com'),
        ('ana', 'ana@leadflow.com')
    ]

    for username, email in users_data:
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(username, email, '123')
            user.groups.add(vendedor_group)
            user.save()
            print(f"✅ Usuario '{username}' creado y asignado como Vendedor.")
        else:
            print(f"ℹ️ El usuario '{username}' ya existe.")

if __name__ == "__main__":
    create_vendors()
