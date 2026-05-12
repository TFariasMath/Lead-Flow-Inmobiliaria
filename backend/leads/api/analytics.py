import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db.models import Count, Q
from django.contrib.auth.models import User
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Lead, WebhookLog, LandingPage, LandingPageVisit, RoundRobinState

logger = logging.getLogger(__name__)

class DashboardStatsView(APIView):
    """
    Calcula los indicadores clave de rendimiento (KPIs) para la pantalla principal.
    Optimizado mediante Agregaciones Condicionales para reducir la carga de BD.
    """
    def get(self, request):
        try:
            user = request.user
            days = request.query_params.get('days')

            # Filtrar el universo de leads según quién consulta y parámetros
            leads_qs = Lead.objects.all()
            webhooks_qs = WebhookLog.objects.all()

            vendor_id = request.query_params.get('vendor_id')
            landing_id = request.query_params.get('landing_id')

            if days and days.isdigit():
                start_date = timezone.now() - timedelta(days=int(days))
                leads_qs = leads_qs.filter(created_at__gte=start_date)
                webhooks_qs = webhooks_qs.filter(created_at__gte=start_date)

            # Lógica de Permisos: Admin puede elegir, vendedor está bloqueado a sí mismo
            # IMPORTANTE: Salud API (webhooks_qs) se mantiene GLOBAL para reflejar fallos técnicos
            # incluso si no tienen lead asignado.
            if user.is_staff and vendor_id and vendor_id.isdigit():
                leads_qs = leads_qs.filter(assigned_to_id=vendor_id)
            elif not user.is_staff:
                leads_qs = leads_qs.filter(assigned_to=user)

            if landing_id and landing_id.isdigit():
                leads_qs = leads_qs.filter(campaign_id=landing_id)

            # 1. Agregación Maestro: Contamos estados y métricas críticas en UNA sola consulta
            stale_threshold = timezone.now() - timedelta(hours=24)
            
            # Construimos los filtros dinámicamente para el agregado
            agg_filters = {
                "total": Count("id"),
                "stale_count": Count("id", filter=~Q(status__in=[Lead.Status.CIERRE_GANADO, Lead.Status.CIERRE_PERDIDO]) & Q(updated_at__lt=stale_threshold))
            }
            
            # Añadimos cada estado a la agregación
            for status_val, _ in Lead.Status.choices:
                agg_filters[f"status_{status_val}"] = Count("id", filter=Q(status=status_val))

            # Ejecutar la súper-consulta
            master_stats = leads_qs.aggregate(**agg_filters)

            # Mapear resultados al formato que el frontend espera
            leads_by_status = {}
            for status_val, status_label in Lead.Status.choices:
                leads_by_status[status_label] = master_stats.get(f"status_{status_val}", 0)

            # 2. Métricas técnicas de Webhooks (Salud de las integraciones)
            webhook_stats = webhooks_qs.aggregate(
                total=Count("id"),
                success=Count("id", filter=Q(status=WebhookLog.Status.SUCCESS)),
                failed=Count("id", filter=Q(status=WebhookLog.Status.FAILED))
            )
            
            total_webhooks = webhook_stats["total"]
            success_rate = (webhook_stats["success"] / total_webhooks * 100) if total_webhooks > 0 else 0

            # 3. Análisis de origen con conversión y participación (Optimizado con .annotate)
            source_groups = (
                leads_qs.values("first_source__name")
                .annotate(
                    total=Count("id"),
                    won=Count("id", filter=Q(status=Lead.Status.CIERRE_GANADO))
                )
                .order_by("-total") # Ordenamos por volumen de adquisición por defecto
            )
            
            total_leads_count = master_stats["total"]
            
            sources_data = [{
                "name": sg["first_source__name"] or "Desconocido",
                "count": sg["total"],
                "won_count": sg["won"],
                "conversion_rate": round((sg["won"] / sg["total"] * 100), 1) if sg["total"] > 0 else 0,
                "acquisition_share": round((sg["total"] / total_leads_count * 100), 1) if total_leads_count > 0 else 0
            } for sg in source_groups]

            # 4. Métricas de Marketing (Landing Pages)
            visits_qs = LandingPageVisit.objects.all()
            if landing_id and landing_id.isdigit():
                visits_qs = visits_qs.filter(landing_page__campaign_id=landing_id)

            if days and days.isdigit():
                visits_count = visits_qs.filter(created_at__gte=start_date).count()
            else:
                from django.db.models import Sum
                if landing_id and landing_id.isdigit():
                    visits_count = LandingPage.objects.filter(campaign_id=landing_id).aggregate(total=Sum('visits_count'))['total'] or 0
                else:
                    visits_count = LandingPage.objects.aggregate(total=Sum('visits_count'))['total'] or 0

            # 5. Datos para el Embudo (Lógica Acumulativa)
            # Un lead en "Cierre Ganado" cuenta para todos los pasos anteriores.
            funnel_stages = [
                (Lead.Status.NUEVO, "Nuevo"),
                (Lead.Status.CONTACTADO, "Contactado"),
                (Lead.Status.EN_CALIFICACION, "En Calificación"),
                (Lead.Status.PROPUESTA_ENVIADA, "Propuesta Enviada"),
                (Lead.Status.CIERRE_GANADO, "Cierre Ganado"),
            ]
            
            funnel_data = []
            cumulative_count = 0
            # Iteramos en reversa para acumular
            temp_funnel = []
            for status_val, label in reversed(funnel_stages):
                count = master_stats.get(f"status_{status_val}", 0)
                cumulative_count += count
                temp_funnel.append({
                    "label": label.upper(),
                    "value": cumulative_count
                })
            
            funnel_data = list(reversed(temp_funnel))

            # 6. Datos temporales para Gráficos de Líneas (Tráfico y Leads)
            from django.db.models.functions import TruncDay
            
            # Determinamos el periodo real para el gráfico
            chart_days = int(days) if days and days.isdigit() else 30
            chart_start = timezone.now() - timedelta(days=chart_days)

            # Visitas diarias
            visits_chart_qs = LandingPageVisit.objects.filter(created_at__gte=chart_start)
            if landing_id and landing_id.isdigit():
                visits_chart_qs = visits_chart_qs.filter(landing_page__campaign_id=landing_id)
            
            daily_visits = (
                visits_chart_qs
                .annotate(day=TruncDay('created_at'))
                .values('day')
                .annotate(count=Count('id'))
                .order_by('day')
            )

            # Leads diarios
            daily_leads = (
                leads_qs.filter(created_at__gte=chart_start)
                .annotate(day=TruncDay('created_at'))
                .values('day')
                .annotate(count=Count('id'))
                .order_by('day')
            )

            # Formatear para el frontend
            history_map = {}
            for i in range(chart_days + 1):
                d = (chart_start + timedelta(days=i)).date().isoformat()
                history_map[d] = {"date": d, "visits": 0, "leads": 0}

            for dv in daily_visits:
                d_str = dv['day'].date().isoformat()
                if d_str in history_map:
                    history_map[d_str]["visits"] = dv['count']

            for dl in daily_leads:
                d_str = dl['day'].date().isoformat()
                if d_str in history_map:
                    history_map[d_str]["leads"] = dl['count']

            visits_over_time = sorted(history_map.values(), key=lambda x: x['date'])

            # 7. Desglose de Origen Técnico (API vs Manual)
            leads_via_api = leads_qs.filter(webhook_logs__isnull=False).distinct().count()
            leads_manual = total_leads_count - leads_via_api

            data = {
                "total_leads": total_leads_count,
                "leads_via_api": leads_via_api,
                "leads_manual": leads_manual,
                "leads_by_status": leads_by_status,
                "total_webhooks": total_webhooks,
                "total_landing_visits": visits_count,
                "successful_webhooks": webhook_stats["success"],
                "failed_webhooks": webhook_stats["failed"],
                "webhook_success_rate": round(success_rate, 1),
                "leads_by_source": sources_data,
                "stale_leads_count": master_stats["stale_count"],
                "funnel_data": funnel_data,
                "visits_over_time": visits_over_time,
                "status": "healthy"
            }
            return Response(data)
        except Exception as e:
            logger.error(f"Dashboard Stats Error: {str(e)}")
            return Response({
                "status": "error",
                "message": "Error al calcular métricas optimizadas",
                "error_detail": str(e) if settings.DEBUG else None
            }, status=status.HTTP_200_OK)


class PerformanceAnalyticsView(APIView):
    """
    Compara el rendimiento de cierre entre distintos vendedores.
    Optimizado: De N consultas a 1 sola consulta SQL con agregación.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        # Usamos .annotate para calcular todas las métricas de cada usuario en el motor de BD
        vendors_qs = User.objects.filter(is_active=True).annotate(
            total_assigned=Count("assigned_leads"),
            won_count=Count("assigned_leads", filter=Q(assigned_leads__status=Lead.Status.CIERRE_GANADO)),
            lost_count=Count("assigned_leads", filter=Q(assigned_leads__status=Lead.Status.CIERRE_PERDIDO))
        ).select_related("vendor_profile")

        data = []
        for vendor in vendors_qs:
            total = vendor.total_assigned
            won = vendor.won_count
            
            conversion_rate = (won / total * 100) if total > 0 else 0
            
            data.append({
                "vendor_id": vendor.id,
                "vendor_name": f"{vendor.first_name} {vendor.last_name}".strip() or vendor.username,
                "total_assigned": total,
                "won": won,
                "lost": vendor.lost_count,
                "conversion_rate": round(conversion_rate, 2),
                "is_available": getattr(vendor, "vendor_profile", None) and vendor.vendor_profile.is_available_for_leads,
                "is_next_in_line": False # Calculado abajo
            })
            
        # 8. Identificar quién sigue en el Round Robin (Lógica Blindada)
        active_vendors_ids = [
            v.id for v in User.objects.filter(
                is_active=True, 
                is_staff=False,
                vendor_profile__is_available_for_leads=True
            ).order_by('id')
        ]
        
        next_vendor_id = None
        if active_vendors_ids:
            state = RoundRobinState.get_state()
            last_id = state.last_assigned_user_id
            
            # Si el último asignado ya no está disponible, el siguiente es el primero de la lista
            if last_id not in active_vendors_ids:
                next_vendor_id = active_vendors_ids[0]
            else:
                # Si está disponible, buscamos el índice y pasamos al siguiente (con rotación)
                last_index = active_vendors_ids.index(last_id)
                next_index = (last_index + 1) % len(active_vendors_ids)
                next_vendor_id = active_vendors_ids[next_index]
            
            # Aplicar el badge solo si el usuario está en la lista de datos y es el calculado
            for v_data in data:
                # Un usuario pausado NUNCA puede ser el siguiente
                if not v_data.get("is_available", False):
                    v_data["is_next_in_line"] = False
                    continue
                    
                if v_data["vendor_id"] == next_vendor_id:
                    v_data["is_next_in_line"] = True
                else:
                    v_data["is_next_in_line"] = False
            
        # Ordenar el ranking: mejores vendedores primero
        data.sort(key=lambda x: x["conversion_rate"], reverse=True)

        return Response(data)

    def post(self, request):
        """
        Alterna la disponibilidad de un vendedor para el Round Robin.
        """
        vendor_id = request.data.get("vendor_id")
        if not vendor_id:
            return Response({"error": "ID de vendedor requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        from ..models import VendorProfile
        try:
            profile = VendorProfile.objects.get(user_id=vendor_id)
            profile.is_available_for_leads = not profile.is_available_for_leads
            profile.save()
            return Response({
                "vendor_id": vendor_id,
                "is_available": profile.is_available_for_leads
            })
        except VendorProfile.DoesNotExist:
            return Response({"error": "Perfil no encontrado"}, status=status.HTTP_404_NOT_FOUND)
