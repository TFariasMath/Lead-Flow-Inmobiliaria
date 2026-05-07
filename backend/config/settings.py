"""
Lead Flow - Django Settings
===========================
Configuración principal del proyecto. Usa PostgreSQL vía Docker
y JWT para autenticación de vendedores.
"""

# Importaciones de módulos estándar de Python
import os  # Permite interactuar con el sistema operativo y variables de entorno
from pathlib import Path  # Facilita el manejo de rutas de archivos de forma multiplataforma
from datetime import timedelta  # Utilizado para definir lapsos de tiempo (especialmente para JWT)

# BASE_DIR define la ruta raíz del proyecto (donde está manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY es una clave única de seguridad; se intenta leer de una variable de entorno por seguridad
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-leadflow-dev-key-change-in-production-2024"
)

# DEBUG activa el modo de depuración; lee de variable de entorno o por defecto es True en desarrollo
DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1")

# ALLOWED_HOSTS define qué dominios pueden servir esta app; '*' permite cualquiera (útil en dev)
ALLOWED_HOSTS = ["*"]


# ─── Aplicaciones Instaladas (Componentes del Sistema) ────────────────────────

INSTALLED_APPS = [
    "django.contrib.admin",         # Interfaz administrativa integrada de Django
    "django.contrib.auth",          # Sistema de autenticación (usuarios, grupos, permisos)
    "django.contrib.contenttypes",   # Permite relacionar permisos con modelos genéricos
    "django.contrib.sessions",       # Gestión de sesiones de usuario persistentes
    "django.contrib.messages",       # Sistema para notificaciones flash al usuario
    "django.contrib.staticfiles",    # Manejo de archivos CSS, JavaScript e imágenes
    # Librerías de Terceros (Extraídas de requirements.txt)
    "rest_framework",               # Herramientas para construir APIs potentes
    "rest_framework_simplejwt",     # Plugin para usar tokens JWT con el API
    "corsheaders",                  # Maneja las políticas de intercambio de recursos (CORS)
    "django_filters",               # Permite filtrar datos en los endpoints del API
    "simple_history",               # Mantiene un historial completo de cambios en los modelos
    "django_q",                     # Motor para ejecutar tareas pesadas en segundo plano
    # Aplicaciones Propias del Proyecto
    "leads",                        # Aplicación principal que gestiona los leads y campañas
]

# ─── Middleware (Capa de procesamiento de peticiones) ─────────────────────────

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",        # Aplica mejoras de seguridad HTTP
    "django.contrib.sessions.middleware.SessionMiddleware", # Inicia y cierra sesiones de usuario
    "corsheaders.middleware.CorsMiddleware",               # Controla quién puede consultar el API (CORS)
    "django.middleware.common.CommonMiddleware",            # Manejo de URLs y reescrituras comunes
    "django.middleware.csrf.CsrfViewMiddleware",            # Protege contra ataques de falsificación de petición
    "django.contrib.auth.middleware.AuthenticationMiddleware", # Asocia usuarios con peticiones HTTP
    "django.contrib.messages.middleware.MessageMiddleware",    # Procesa mensajes temporales entre peticiones
    "django.middleware.clickjacking.XFrameOptionsMiddleware", # Evita que el sitio se cargue en iframes externos
    "simple_history.middleware.HistoryRequestMiddleware",    # Captura quién realiza cambios en la BD
]

# ROOT_URLCONF indica dónde está el mapa principal de rutas (URLs)
ROOT_URLCONF = "config.urls"

# Configuración del motor de renderizado de plantillas HTML
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates", # Motor estándar de Django
        "DIRS": [],                                                    # Carpetas adicionales de plantillas
        "APP_DIRS": True,                                              # Buscar plantillas dentro de cada app
        "OPTIONS": {
            "context_processors": [                                    # Variables disponibles en todo el HTML
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# Punto de entrada para servidores web en producción (ej. Gunicorn)
WSGI_APPLICATION = "config.wsgi.application"


# ─── Base de Datos (PostgreSQL vía Docker) ────────────────────────────────────

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",            # Motor de base de datos relacional
        "NAME": os.environ.get("DB_NAME", "leadflow"),        # Nombre de la base de datos
        "USER": os.environ.get("DB_USER", "leadflow_user"),   # Usuario para la conexión
        "PASSWORD": os.environ.get("DB_PASSWORD", "leadflow_secret_2024"), # Contraseña de acceso
        "HOST": os.environ.get("DB_HOST", "localhost"),       # Servidor (en Docker se usa el nombre del servicio)
        "PORT": os.environ.get("DB_PORT", "5432"),            # Puerto estándar de Postgres
    }
}


# ─── Autenticación (Validación de robustez de claves) ─────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"}, # Evita claves parecidas al nombre
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},         # Exige un largo mínimo
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},        # Prohíbe claves muy comunes
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},       # Evita claves que sean solo números
]


# ─── Internacionalización y Zona Horaria ─────────────────────────────────────

LANGUAGE_CODE = "es"                        # Define el idioma de los mensajes del sistema (Español)
TIME_ZONE = "America/Santiago"              # Configurado para la zona horaria de Santiago de Chile
USE_I18N = True                             # Activa el soporte para traducciones (Internalización)
USE_TZ = True                               # Almacena fechas en UTC internamente pero las muestra localmente


# ─── Archivos Estáticos (CSS, JS, Imágenes) ───────────────────────────────────

STATIC_URL = "static/"                      # URL base para servir archivos estáticos
STATIC_ROOT = BASE_DIR / "staticfiles"      # Carpeta donde se guardan los estáticos al desplegar


# ─── Emails (Automatización y Nurturing) ─────────────────────────────────────

# EMAIL_BACKEND define cómo se envían los correos. Se usa uno personalizado que guarda en BD.
EMAIL_BACKEND = "leads.email_backends.DatabaseEmailBackend"
# DEFAULT_FROM_EMAIL es el nombre y correo que verá el lead al recibir un mensaje
DEFAULT_FROM_EMAIL = "CRM Inmobiliaria <no-reply@crm-inmobiliaria.com>"

# Configuración SMTP para cuando el sistema pase a producción real
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.ejemplo.com") # Servidor de correo
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))            # Puerto del servidor
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True" # Uso de conexión cifrada
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")        # Usuario SMTP
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "") # Contraseña SMTP


# ─── Django Rest Framework (DRF) ─────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication", # Solo permite acceso vía JWT
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",                # Protege todas las rutas por defecto
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",         # Habilita filtrado avanzado
        "rest_framework.filters.SearchFilter",                        # Habilita búsqueda global
        "rest_framework.filters.OrderingFilter",                      # Habilita ordenamiento de tablas
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination", # Estilo de paginado
    "PAGE_SIZE": 20,                                                  # Registros máximos por vista
}


# ─── Configuración de JWT (SimpleJWT) ─────────────────────────────────────────

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),     # El token del frontend expira en 8 horas
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),     # El token de renovación dura una semana
    "ROTATE_REFRESH_TOKENS": True,                   # Cada vez que renuevas, recibes un token nuevo
    "AUTH_HEADER_TYPES": ("Bearer",),                # Formato esperado: Authorization: Bearer <token>
}


# ─── CORS (Control de acceso desde el Frontend) ───────────────────────────────

# Si estamos en modo DEBUG, permitimos peticiones de cualquier lugar (desarrollo)
CORS_ALLOW_ALL_ORIGINS = DEBUG
# Dominios específicos permitidos (Frontend oficial)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]


# ─── Identificadores por Defecto ──────────────────────────────────────────────

# Define el tipo de dato para las llaves primarias autogeneradas (IDs)
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ─── Django Q2 (Colas de Tareas en Segundo Plano) ──────────────────────────────

import sys # Necesario para detectar si estamos en modo de pruebas unitarias
# TESTING captura si el comando ejecutado es 'manage.py test'
TESTING = len(sys.argv) > 1 and sys.argv[1] == "test"

# Q_CLUSTER define cómo se comportan los trabajadores que procesan tareas asíncronas
Q_CLUSTER = {
    "name": "LeadFlowCluster",      # Identificador del cluster
    "workers": 4,                   # Número de núcleos dedicados a tareas de fondo
    "recycle": 500,                 # Reinicia procesos para mantener limpieza de memoria
    "timeout": 60,                  # Máximo de segundos que puede durar una tarea
    "compress": True,               # Ahorra espacio en la base de datos comprimiendo datos
    "save_limit": 250,              # Cuántas tareas exitosas recordar en el historial
    "queue_limit": 500,             # Cuántas tareas pueden esperar antes de rechazar nuevas
    "cpu_affinity": 1,              # Optimización de procesador
    "label": "Django Q",            # Nombre visual en herramientas de monitoreo
    "orm": "default",               # Indica que las tareas se guardan en el mismo PostgreSQL
    "sync": TESTING,                # En modo test, las tareas son inmediatas (sincrónicas)
}

