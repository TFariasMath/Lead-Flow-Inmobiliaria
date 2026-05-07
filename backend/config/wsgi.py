"""
Configuración WSGI para el proyecto Lead Flow.
=============================================
WSGI (Web Server Gateway Interface) es el estándar de Python para servidores web
en producción (como Gunicorn o uWSGI). Expone el objeto 'application' que
el servidor web buscará para ejecutar el sitio.
"""

import os  # Módulo estándar para manipular variables de entorno
from django.core.wsgi import get_wsgi_application  # Carga la interfaz de aplicación de Django

# Indica a Django qué archivo de configuración (settings.py) debe cargar por defecto
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Inicializa y expone la aplicación WSGI
application = get_wsgi_application()

