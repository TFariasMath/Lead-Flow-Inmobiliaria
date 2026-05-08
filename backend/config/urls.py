"""
Lead Flow - Global URL Configuration
====================================
Este archivo es el 'Gran Central Terminal' de la aplicación.
Aquí se definen los puntos de entrada principales y se delegan las rutas
específicas a las aplicaciones correspondientes.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Importaciones para el sistema de Autenticación JWT
from rest_framework_simplejwt.views import TokenRefreshView
from leads.api import CustomTokenObtainPairView

urlpatterns = [
    # 1. Panel de Administración
    # Interfaz nativa de Django para que el staff gestione la base de datos.
    path("admin/", admin.site.urls),

    # 2. Sistema de Seguridad (Auth JWT)
    # Endpoint de Login: Intercambia usuario/password por un Token de acceso.
    path("api/v1/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain"),
    
    # Endpoint de Refresco: Permite al frontend seguir logueado sin pedir password de nuevo.
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # 3. Módulos de Negocio
    # Incluye todas las rutas definidas en leads/urls.py bajo el prefijo /api/v1/
    # Esto mantiene el proyecto organizado por aplicaciones.
    path("api/v1/", include("leads.urls")),
]

# 4. Archivos Multimedia (Solo en Desarrollo)
# Permite servir imágenes subidas (MediaAssets) directamente desde el servidor de Django.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

