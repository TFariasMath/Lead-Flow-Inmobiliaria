"""
Lead Flow - WSGI Configuration
==============================
Este archivo actúa como el puente entre el servidor web de producción 
(Gunicorn, Nginx, uWSGI) y el código Python de Django.

WSGI (Web Server Gateway Interface) es el protocolo estándar para aplicaciones 
Python. Expone una variable llamada 'application' que el servidor web ejecuta 
para procesar cada petición HTTP que llega al CRM.
"""

import os
from django.core.wsgi import get_wsgi_application

# 1. Definir el entorno:
# Le dice a Python dónde encontrar el archivo de configuración principal (settings.py).
# "config.settings" apunta a la carpeta backend/config/settings.py
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# 2. Arrancar la aplicación:
# get_wsgi_application() carga los modelos, las URLs y toda la maquinaria de Django.
# En producción, Gunicorn apuntará a 'config.wsgi:application'
application = get_wsgi_application()

