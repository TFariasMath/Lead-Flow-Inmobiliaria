"""
Lead Flow - Django Settings (Core Configuration)
================================================
Este archivo centraliza el comportamiento técnico de todo el CRM.
Define desde la conexión a la base de datos hasta las políticas de seguridad.

Para producción, muchas de estas constantes deben leerse de variables de entorno
(.env) para no exponer secretos en el repositorio.
"""

import os
from pathlib import Path
from datetime import timedelta

# Ruta base del proyecto (donde se encuentra manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Seguridad Básica ────────────────────────────────────────────────────────

# SECRET_KEY: Llave maestra para firmas criptográficas y sesiones.
# En producción, NUNCA uses la llave por defecto.
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-leadflow-dev-key-change-in-production-2024"
)

# DEBUG: Si es True, muestra errores detallados (útil en desarrollo).
# En producción DEBE ser False para no exponer el código al atacante.
DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1")

# Permitir que el dashboard incruste el preview del PDF en un iframe
X_FRAME_OPTIONS = 'ALLOWALL'

# ALLOWED_HOSTS: Lista de dominios que pueden servir esta app (ej: 'crm.tuempresa.com').
ALLOWED_HOSTS = ["*"]

# CORS: Permite que el frontend (Next.js) acceda a la API
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True


# ─── Aplicaciones Instaladas ──────────────────────────────────────────────────

INSTALLED_APPS = [
    # Módulos Core de Django
    "django.contrib.admin",         # Panel administrativo (/admin)
    "django.contrib.auth",          # Gestión de usuarios y permisos
    "django.contrib.contenttypes",   # Framework de tipos de contenido
    "django.contrib.sessions",       # Persistencia de sesiones
    "django.contrib.messages",       # Mensajes flash
    "django.contrib.staticfiles",    # Archivos CSS/JS/Imágenes
    
    # Librerías Externas (Instaladas vía pip)
    "rest_framework",               # Framework para la API REST
    "rest_framework_simplejwt",     # Autenticación moderna vía tokens
    "corsheaders",                  # Permite que el Frontend (React/Vue) hable con el Backend
    "django_filters",               # Filtrado potente en URLs de la API
    "simple_history",               # Auditoría de cambios (Log de cambios por usuario)
    "django_q",                     # Motor de tareas en segundo plano (Workers)
    
    # Módulos Propios
    "leads",                        # Aplicación principal del CRM
]


# ─── Middleware (La 'Cebolla' de Procesamiento) ───────────────────────────────

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware", # Debe ir antes de CommonMiddleware
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware", # Captura el usuario que edita la DB
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            BASE_DIR / "templates",  # Carpetas locales del backend
            BASE_DIR.parent / "messaging-lab" / "templates", # Carpeta del Lab (Sincronizada)
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# ─── Base de Datos (PostgreSQL) ───────────────────────────────────────────────

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "leadflow"),
        "USER": os.environ.get("DB_USER", "leadflow_user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "leadflow_secret_2024"),
        "HOST": os.environ.get("DB_HOST", "localhost"), # 'db' si se usa Docker Compose
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}


# ─── Configuración de Internacionalización ────────────────────────────────────

LANGUAGE_CODE = "es"                        # Interfaz en Español
TIME_ZONE = "America/Santiago"              # Horario de Chile
USE_I18N = True
USE_TZ = True                               # Almacena en UTC, muestra en local


# ─── Archivos Estáticos y Media ───────────────────────────────────────────────

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media: Carpeta donde se guardan las imágenes subidas por los usuarios
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# ─── Sistema de Emails ────────────────────────────────────────────────────────

# Usamos nuestro propio backend para guardar mails en la base de datos local
EMAIL_BACKEND = "leads.email_backends.DatabaseEmailBackend"
DEFAULT_FROM_EMAIL = "Lead Flow CRM <no-reply@leadflow.dev>"


# ─── Django Rest Framework & Seguridad API ───────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated", # Todo cerrado por defecto
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20, # 20 leads por página en las tablas
}


# ─── Configuración JWT ────────────────────────────────────────────────────────

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),     # Sesión activa por 8 horas
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),     # Renovable por una semana
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# ─── Django Q2 (Background Workers) ──────────────────────────────────────────

import sys
TESTING = len(sys.argv) > 1 and sys.argv[1] == "test"

Q_CLUSTER = {
    "name": "LeadFlowWorker",
    "workers": 4,
    "recycle": 500,
    "timeout": 60,
    "orm": "default", # Usa la misma base de datos para la cola de tareas
    "sync": TESTING,   # En tests, las tareas se ejecutan al instante
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

