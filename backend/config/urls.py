"""
Lead Flow - Configuración Global de URLs
========================================
Este archivo actúa como el enrutador principal del servidor.
"""

from django.contrib import admin  # Importa el módulo de administración de Django
from django.urls import path, include  # Funciones para mapear rutas y enlazar otros archivos de URLs
from rest_framework_simplejwt.views import TokenRefreshView  # Vista para renovar tokens JWT expirados
from leads.api import CustomTokenObtainPairView  # Vista personalizada para login y obtención de tokens JWT

# Definición de la lista de patrones de URL del proyecto
urlpatterns = [
    # Acceso al Panel de Administración (ej: midominio.com/admin/)
    path("admin/", admin.site.urls),

    # ─── Autenticación de Usuarios (JWT) ──────────────────────────────────────

    # Endpoint para iniciar sesión: Recibe credenciales y devuelve el par de tokens (Access y Refresh)
    path("api/v1/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain"),

    # Endpoint para refrescar el token: Permite obtener un nuevo Access Token usando el Refresh Token
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ─── Rutas de Negocio (App Leads) ─────────────────────────────────────────

    # Conecta todas las rutas de la aplicación 'leads' bajo el prefijo global 'api/v1/'
    path("api/v1/", include("leads.urls")),
]

