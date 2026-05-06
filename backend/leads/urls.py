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
    InteractionViewSet,
    UserListView,
    DashboardStatsView,
)

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"webhook-logs", WebhookLogViewSet, basename="webhooklog")
router.register(r"sources", SourceViewSet, basename="source")
router.register(r"interactions", InteractionViewSet, basename="interaction")

urlpatterns = [
    # Webhook público
    path("webhooks/receive/", WebhookReceiveView.as_view(), name="webhook-receive"),
    # Dashboard
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    # Usuarios (vendedores)
    path("users/", UserListView.as_view(), name="user-list"),
    # Router DRF
    path("", include(router.urls)),
]
