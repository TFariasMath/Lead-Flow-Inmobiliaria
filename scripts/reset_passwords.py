"""
Lead Flow - Herramienta de Recuperación de Acceso
================================================
Este script resetea las contraseñas de TODOS los usuarios registrados 
a un valor por defecto ('admin123').

ADVERTENCIA: Solo debe usarse en entornos de desarrollo o en casos de 
emergencia donde se haya perdido el acceso administrativo.
"""

import os
import sys
import django

# 1. Configuración del entorno de Django:
# Añade la carpeta 'backend' al path de Python para que pueda importar los modelos.
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Inicializa Django (carga apps, modelos y base de datos)
django.setup()

from django.contrib.auth.models import User

def run():
    """Itera por todos los usuarios y fuerza el cambio de contraseña."""
    users = User.objects.all()
    if not users.exists():
        print("No se encontraron usuarios en la base de datos.")
        return

    for u in users:
        # u.set_password() se encarga de aplicar el hash (PBKDF2) automáticamente.
        u.set_password("admin123")
        u.save()
        print(f"Éxito: Contraseña restaurada para el usuario: {u.username}")

if __name__ == "__main__":
    print("Iniciando reseteo masivo de contraseñas...")
    run()
    print("Proceso finalizado. Use 'admin123' para entrar.")
