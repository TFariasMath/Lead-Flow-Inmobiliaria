import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db.models import Count
from django.contrib.auth.models import User
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Lead, WebhookLog

logger = logging.getLogger(__name__)

class DashboardStatsView(APIView):
    """
    Calcula los indicadores clave de rendimiento (KPIs) para la pantalla principal.
    """
    def get(self, request):
        try:
            user = request.user
            days = request.query_params.get('days')

            # Filtrar el universo de leads según quién consulta
            leads_qs = Lead.objects.all()

            if days and days.isdigit():
                start_date = timezone.now() - timedelta(days=int(days))
                leads_qs = leads_qs.filter(created_at__gte=start_date)

            if not user.is_staff:
                leads_qs = leads_qs.filter(assigned_to=user)

            total_leads = leads_qs.count()

            # Agrupación por estado del pipeline
            leads_by_status = {}
            for choice_value, choice_label in Lead.Status.choices:
                count = leads_qs.filter(status=choice_value).count()
                leads_by_status[choice_label] = count

            # Métricas técnicas de Webhooks (Salud de las integraciones)
            total_webhooks = WebhookLog.objects.count()
            successful = WebhookLog.objects.filter(status=WebhookLog.Status.SUCCESS).count()
            failed = WebhookLog.objects.filter(status=WebhookLog.Status.FAILED).count()
            success_rate = (successful / total_webhooks * 100) if total_webhooks > 0 else 0

            # Análisis de origen con conversión
            sources_data = []
            source_groups = leads_qs.values("first_source__name").annotate(total=Count("id"))
            for sg in source_groups:
                s_name = sg["first_source__name"]
                total = sg["total"]
                won = leads_qs.filter(first_source__name=s_name, status=Lead.Status.CIERRE_GANADO).count()
                sources_data.append({
                    "name": s_name or "Desconocido",
                    "count": total,
                    "won_count": won,
                    "conversion_rate": round((won / total * 100), 1) if total > 0 else 0
                })
            sources_data = sorted(sources_data, key=lambda x: x["won_count"], reverse=True)

            # Leads Estancados (> 24h sin actualizar)
            stale_threshold = timezone.now() - timedelta(hours=24)
            stale_leads_count = leads_qs.exclude(
                status__in=[Lead.Status.CIERRE_GANADO, Lead.Status.CIERRE_PERDIDO]
            ).filter(updated_at__lt=stale_threshold).count()

            # Datos para el Embudo (Ordenados por etapa lógica)
            funnel_stages = [
                (Lead.Status.NUEVO, "Nuevo"),
                (Lead.Status.CONTACTADO, "Contactado"),
                (Lead.Status.EN_CALIFICACION, "En Calificación"),
                (Lead.Status.PROPUESTA_ENVIADA, "Propuesta Enviada"),
                (Lead.Status.CIERRE_GANADO, "Cierre Ganado"),
            ]
            funnel_data = []
            for status, label in funnel_stages:
                funnel_data.append({
                    "label": label,
                    "value": leads_qs.filter(status=status).count()
                })

            data = {
                "total_leads": total_leads,
                "leads_by_status": leads_by_status,
                "total_webhooks": total_webhooks,
                "successful_webhooks": successful,
                "failed_webhooks": failed,
                "webhook_success_rate": round(success_rate, 1),
                "leads_by_source": sources_data,
                "stale_leads_count": stale_leads_count,
                "funnel_data": funnel_data,
                "status": "healthy"
            }
            return Response(data)
        except Exception as e:
            logger.error(f"Dashboard Stats Error: {str(e)}")
            return Response({
                "status": "error",
                "message": "Error al cargar algunas métricas",
                "error_detail": str(e) if settings.DEBUG else None
            }, status=status.HTTP_200_OK)


class PerformanceAnalyticsView(APIView):
    """
    Compara el rendimiento de cierre entre distintos vendedores.
    Exclusivo para administradores.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        # Consideramos a todos los usuarios activos para el ranking de rendimiento
        vendors = User.objects.filter(is_active=True)
        data = []

        for vendor in vendors:
            # Métricas por vendedor
            total = Lead.objects.filter(assigned_to=vendor).count()
            won = Lead.objects.filter(assigned_to=vendor, status=Lead.Status.CIERRE_GANADO).count()
            lost = Lead.objects.filter(assigned_to=vendor, status=Lead.Status.CIERRE_PERDIDO).count()
            
            # Tasa de conversión de leads ganados
            conversion_rate = (won / total * 100) if total > 0 else 0
            
            data.append({
                "vendor_name": f"{vendor.first_name} {vendor.last_name}".strip() or vendor.username,
                "total_assigned": total,
                "won": won,
                "lost": lost,
                "conversion_rate": round(conversion_rate, 2),
                # Estado de disponibilidad para recibir nuevos leads
                "is_available": getattr(vendor, "vendor_profile", None) and vendor.vendor_profile.is_available_for_leads
            })
            
        # Ordenar el ranking: mejores vendedores primero
        data.sort(key=lambda x: x["conversion_rate"], reverse=True)

        return Response(data)
