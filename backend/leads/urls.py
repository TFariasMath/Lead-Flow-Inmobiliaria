"""
Lead Flow - URL Routing (leads app)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

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
)

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"webhook-logs", WebhookLogViewSet, basename="webhooklog")
router.register(r"sources", SourceViewSet, basename="source")
router.register(r"campaigns", CampaignViewSet, basename="campaign")
router.register(r"landings", LandingPageViewSet, basename="landings")
router.register(r"media-assets", MediaAssetViewSet, basename="media-assets")
router.register(r"interactions", InteractionViewSet, basename="interaction")
router.register(r"sent-emails", SentEmailViewSet, basename="sentemail")

urlpatterns = [
    # Webhook público
    path("webhooks/receive/", WebhookReceiveView.as_view(), name="webhook-receive"),
    # Dashboard y Analíticas
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("analytics/performance/", PerformanceAnalyticsView.as_view(), name="analytics-performance"),
    # Exportación
    path("leads/export/", LeadExportView.as_view(), name="leads-export"),
    # Usuarios (vendedores)
    path("users/", UserListView.as_view(), name="user-list"),
    # Landing Pages públicas
    path("landings/<slug:slug>/", LandingPageDetailView.as_view(), name="landing-detail"),
    path("landings/<slug:slug>/submit/", LandingPageSubmitView.as_view(), name="landing-submit"),
    # Brochure dinámico
    path("leads/<uuid:lead_id>/brochure/", LeadBrochureView.as_view(), name="lead-brochure"),
    # Router DRF
    path("", include(router.urls)),
]
