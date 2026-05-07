"""
Lead Flow - API Views
=====================
Vistas DRF. Toda la lógica de negocio está en services.py.
Las vistas solo manejan serialización, permisos y respuestas HTTP.

Seguridad:
- Vendedores solo ven leads asignados a ellos (Row-Level Access).
- Staff/Admin ve todos los leads.
- El endpoint de webhook es público (AllowAny) ya que lo llaman servicios externos.
"""

import logging

from django.contrib.auth.models import User
from django.db.models import Count, Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Lead, Source, Interaction, WebhookLog
from .serializers import (
    LeadListSerializer,
    LeadDetailSerializer,
    LeadCreateSerializer,
    SourceSerializer,
    InteractionSerializer,
    WebhookLogSerializer,
    WebhookReceiveSerializer,
    ReprocessSerializer,
    UserSerializer,
    DashboardStatsSerializer,
    CustomTokenObtainPairSerializer,
)
from .services import WebhookProcessor, ReprocessWebhook

logger = logging.getLogger(__name__)


# ─── Auth / JWT ──────────────────────────────────────────────────────────────

class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista de login que retorna el token customizado (con is_staff)."""
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            from django.contrib.auth.models import User
            from .models import SessionAudit
            
            # SimpleJWT Serializer expects username and password
            username = request.data.get("username")
            user = User.objects.filter(username=username).first()
            if user:
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip = x_forwarded_for.split(',')[0]
                else:
                    ip = request.META.get('REMOTE_ADDR')
                
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                SessionAudit.objects.create(
                    user=user,
                    ip_address=ip,
                    user_agent=user_agent
                )
        return response


# ─── Webhook Receive (público) ───────────────────────────────────────────────

class WebhookReceiveView(APIView):
    """
    POST /api/v1/webhooks/receive/
    Endpoint público que recibe webhooks de fuentes externas.
    Responde 200 OK inmediatamente y procesa en el mismo request.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        # Extraemos el payload completo para no perder nada
        raw_payload = request.data
        
        # Si no envían 'source_type', le asignamos 'unknown'
        source_type = raw_payload.get("source_type", "unknown")
        
        # Si no viene anidado en 'data', asumimos que todo el JSON es la data
        data = raw_payload.get("data", raw_payload)

        # Crear log de inmediato con PENDING
        processor = WebhookProcessor(source_type=source_type, raw_body=data)
        webhook_log = processor.create_log()

        # Enviar tarea a Django-Q2
        from django_q.tasks import async_task
        async_task('leads.tasks.process_webhook_task', str(webhook_log.id))

        return Response(
            {
                "status": "received",
                "webhook_log_id": str(webhook_log.id),
                "processing_status": "pending", # Siempre devolvemos pending al cliente externo
            },
            status=status.HTTP_200_OK,
        )


# ─── Lead ViewSet ────────────────────────────────────────────────────────────

class LeadViewSet(viewsets.ModelViewSet):
    """
    CRUD de Leads con Row-Level Access.
    - Staff: ve todos los leads.
    - Vendedor: solo ve leads asignados a él.
    """
    filterset_fields = ["status", "first_source", "assigned_to"]
    search_fields = ["original_email", "contact_email", "first_name", "last_name", "phone"]
    ordering_fields = ["created_at", "updated_at", "status"]

    def get_serializer_class(self):
        if self.action == "create":
            return LeadCreateSerializer
        if self.action in ("retrieve",):
            return LeadDetailSerializer
        return LeadListSerializer

    def get_queryset(self):
        qs = Lead.objects.select_related("assigned_to", "first_source")

        # Anotar el conteo de interacciones para la lista
        if self.action == "list":
            qs = qs.annotate(interaction_count=Count("interactions"))

        # Row-Level Access: vendedores solo ven sus leads
        user = self.request.user
        if not user.is_staff:
            qs = qs.filter(assigned_to=user)

        return qs

    def perform_create(self, serializer):
        """
        Al crear un lead manualmente:
        - Si es Vendedor: Forzamos la auto-asignación a sí mismo.
        - Si es Admin: Respeta lo que haya elegido en el formulario.
        """
        user = self.request.user
        if not user.is_staff:
            serializer.save(assigned_to=user)
        else:
            serializer.save()

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """GET /api/v1/leads/{id}/history/ - Historial de cambios."""
        lead = self.get_object()
        history_entries = lead.history.all()[:50]
        data = []
        for entry in history_entries:
            data.append({
                "history_id": entry.history_id,
                "history_date": entry.history_date,
                "history_type": entry.get_history_type_display(),
                "history_user": entry.history_user.username if entry.history_user else None,
                "changes": self._get_changes(entry),
            })
        return Response(data)

    def _get_changes(self, history_entry):
        """Compara con la versión anterior para extraer los cambios."""
        changes = {}
        try:
            prev = history_entry.prev_record
            if prev:
                delta = history_entry.diff_against(prev)
                for change in delta.changes:
                    changes[change.field] = {
                        "old": str(change.old),
                        "new": str(change.new),
                    }
        except Exception:
            pass
        return changes


# ─── Webhook Log ViewSet ─────────────────────────────────────────────────────

class WebhookLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vista de logs de webhook. Incluye acción para re-procesar fallidos.
    Solo para administradores.
    """
    serializer_class = WebhookLogSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ["status", "source_type"]
    ordering_fields = ["created_at", "status"]

    def get_queryset(self):
        return WebhookLog.objects.select_related("lead", "edited_by")

    @action(detail=True, methods=["post"])
    def reprocess(self, request, pk=None):
        """
        POST /api/v1/webhook-logs/{id}/reprocess/
        Re-procesa un webhook fallido con el JSON editado.
        """
        webhook_log = self.get_object()

        if webhook_log.status != WebhookLog.Status.FAILED:
            return Response(
                {"error": "Solo se pueden re-procesar webhooks con estado 'Failed'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReprocessSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        result = ReprocessWebhook.reprocess(
            webhook_log=webhook_log,
            edited_body=serializer.validated_data["edited_body"],
            user=request.user,
        )

        return Response(
            WebhookLogSerializer(result).data,
            status=status.HTTP_200_OK,
        )


# ─── Source ViewSet ──────────────────────────────────────────────────────────

class SourceViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.all()
    serializer_class = SourceSerializer


# ─── Interaction ViewSet ─────────────────────────────────────────────────────

class InteractionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InteractionSerializer
    filterset_fields = ["lead", "source"]

    def get_queryset(self):
        qs = Interaction.objects.select_related("source", "lead")
        # Filtrar por lead si se provee en query params
        lead_id = self.request.query_params.get("lead_id")
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        return qs


# ─── Users (Vendedores) ─────────────────────────────────────────────────────

class UserListView(APIView):
    """Lista de usuarios/vendedores para dropdown de asignación."""

    def get(self, request):
        users = User.objects.filter(is_active=True)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class LeadExportView(APIView):
    """
    GET /api/v1/leads/export/
    Exporta los leads a CSV. Si es vendedor, solo exporta los suyos.
    Si es admin, exporta todos.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        import csv
        from django.http import HttpResponse

        user = request.user
        leads_qs = Lead.objects.all().order_by("-created_at")
        
        if not user.is_staff:
            leads_qs = leads_qs.filter(assigned_to=user)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Email Original', 'Nombre', 'Apellido', 'Telefono',
            'Empresa', 'Estado', 'Vendedor', 'Fuente', 'Score', 'Fecha Creacion'
        ])

        for lead in leads_qs:
            writer.writerow([
                lead.id,
                lead.original_email,
                lead.first_name,
                lead.last_name,
                lead.phone,
                lead.company,
                lead.get_status_display(),
                lead.assigned_to.username if lead.assigned_to else "Sin asignar",
                lead.first_source.name if lead.first_source else "Sin fuente",
                lead.score,
                lead.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])

        return response


# ─── Dashboard Stats ────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    """
    GET /api/v1/dashboard/stats/
    Estadísticas para el panel operacional.
    """

    def get(self, request):
        user = request.user

        # Base queryset según permisos
        leads_qs = Lead.objects.all()
        if not user.is_staff:
            leads_qs = leads_qs.filter(assigned_to=user)

        total_leads = leads_qs.count()

        # Leads por estado
        leads_by_status = {}
        for choice_value, choice_label in Lead.Status.choices:
            count = leads_qs.filter(status=choice_value).count()
            leads_by_status[choice_label] = count

        # Webhooks stats
        total_webhooks = WebhookLog.objects.count()
        successful = WebhookLog.objects.filter(status=WebhookLog.Status.SUCCESS).count()
        failed = WebhookLog.objects.filter(status=WebhookLog.Status.FAILED).count()
        success_rate = (successful / total_webhooks * 100) if total_webhooks > 0 else 0

        # Leads por fuente
        leads_by_source = list(
            leads_qs.values("first_source__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        data = {
            "total_leads": total_leads,
            "leads_by_status": leads_by_status,
            "total_webhooks": total_webhooks,
            "successful_webhooks": successful,
            "failed_webhooks": failed,
            "webhook_success_rate": round(success_rate, 1),
            "leads_by_source": leads_by_source,
        }

        return Response(data)


# ─── Analytics (Performance) ──────────────────────────────────────────────────

class PerformanceAnalyticsView(APIView):
    """
    GET /api/v1/analytics/performance/
    Analíticas de rendimiento de vendedores (Solo administradores).
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        from django.db.models import Count, Q

        vendors = User.objects.filter(is_active=True, is_staff=False)
        data = []

        for vendor in vendors:
            total = Lead.objects.filter(assigned_to=vendor).count()
            won = Lead.objects.filter(assigned_to=vendor, status=Lead.Status.CIERRE_GANADO).count()
            lost = Lead.objects.filter(assigned_to=vendor, status=Lead.Status.CIERRE_PERDIDO).count()
            
            conversion_rate = (won / total * 100) if total > 0 else 0
            
            data.append({
                "vendor_name": f"{vendor.first_name} {vendor.last_name}".strip() or vendor.username,
                "total_assigned": total,
                "won": won,
                "lost": lost,
                "conversion_rate": round(conversion_rate, 2),
                "is_available": getattr(vendor, "vendor_profile", None) and vendor.vendor_profile.is_available_for_leads
            })
            
        # Ordenar por tasa de conversión descendente
        data.sort(key=lambda x: x["conversion_rate"], reverse=True)

        return Response(data)
