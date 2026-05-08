"""
Lead Flow - URL Routing
=======================
Mapa de rutas internas de la aplicación de leads.
Aquí se definen tanto los ViewSets automáticos (CRUD) como las vistas personalizadas.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importamos todas las vistas desde api.py
from .api import (
    WebhookReceiveView,
    LeadViewSet,
    WebhookLogViewSet,
    SourceViewSet,
    CampaignViewSet,
    InteractionViewSet,
    UserListView,
    DashboardStatsView,
    PerformanceAnalyticsView,
    LeadExportView,
    LandingPageDetailView,
    LandingPageSubmitView,
    SentEmailViewSet,
    LeadBrochureView,
    LandingPageViewSet,
    MediaAssetViewSet,
    GroupViewSet,
    PermissionListView,
)

# 1. Configuración del Router de Django Rest Framework
# Los Routers generan automáticamente las rutas para LIST, CREATE, RETRIEVE, UPDATE, DELETE.
router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"webhook-logs", WebhookLogViewSet, basename="webhooklog")
router.register(r"sources", SourceViewSet, basename="source")
router.register(r"campaigns", CampaignViewSet, basename="campaign")
router.register(r"landings", LandingPageViewSet, basename="landings")
router.register(r"media-assets", MediaAssetViewSet, basename="media-assets")
router.register(r"interactions", InteractionViewSet, basename="interaction")
router.register(r"sent-emails", SentEmailViewSet, basename="sentemail")
router.register(r"groups", GroupViewSet, basename="group")

# 2. Definición de URLs específicas (Endpoints de lógica de negocio)
urlpatterns = [
    # INGESTA: Punto de entrada para webhooks externos (Zapier, Facebook, etc)
    path("webhooks/receive/", WebhookReceiveView.as_view(), name="webhook-receive"),
    
    # DASHBOARD: Estadísticas operacionales y métricas de rendimiento
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("analytics/performance/", PerformanceAnalyticsView.as_view(), name="analytics-performance"),
    
    # UTILIDADES: Exportación a CSV para reportes externos
    path("leads/export/", LeadExportView.as_view(), name="leads-export"),
    
    # SEGURIDAD: Listado de usuarios para asignación manual y gestión de roles
    path("users/", UserListView.as_view(), name="user-list"),
    path("permissions/", PermissionListView.as_view(), name="permission-list"),
    
    # LANDINGS: Endpoints públicos para el funcionamiento de las páginas de aterrizaje
    path("landings/<slug:slug>/", LandingPageDetailView.as_view(), name="landing-detail"),
    path("landings/<slug:slug>/submit/", LandingPageSubmitView.as_view(), name="landing-submit"),
    
    # DOCUMENTOS: Link dinámico para descargar el brochure PDF personalizado
    path("leads/<uuid:lead_id>/brochure/", LeadBrochureView.as_view(), name="lead-brochure"),
    
    # API: Inclusión de todas las rutas generadas por el router DRF
    path("", include(router.urls)),
]
