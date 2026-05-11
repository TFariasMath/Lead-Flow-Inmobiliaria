import csv
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from django.http import HttpResponse
from rest_framework import viewsets, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Lead, Interaction
from ..serializers import (
    LeadListSerializer, LeadDetailSerializer, LeadCreateSerializer,
    InteractionSerializer
)

class LeadViewSet(viewsets.ModelViewSet):
    """
    Controlador principal para el listado y edición de leads.
    Implementa seguridad de nivel de fila (Row-Level Security) 
    y respeta los permisos de Django.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]
    # Motores de filtrado activados para esta vista
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # Campos por los que se puede filtrar exactamente via URL (?status=...)
    filterset_fields = ["status", "assigned_to", "campaign", "first_source"]
    # Campos en los que se puede buscar texto
    search_fields = ["original_email", "contact_email", "first_name", "last_name", "phone"]
    # Campos por los que se puede ordenar
    ordering_fields = ["created_at", "updated_at", "status"]

    def get_serializer_class(self):
        """
        Cambia el serializador según la acción para optimizar el envío de datos.
        """
        if self.action == "create":
            return LeadCreateSerializer # Serializador ligero para creación
        if self.action in ("retrieve",):
            return LeadDetailSerializer # Serializador completo con historial y notas
        return LeadListSerializer       # Serializador optimizado para tablas

    def get_queryset(self):
        """
        Filtra los datos según quién esté pidiendo la información.
        """
        # Optimizamos la consulta con select_related para evitar el problema N+1
        qs = Lead.objects.select_related("assigned_to", "first_source")

        # Si estamos listando, añadimos el conteo de interacciones (timeline)
        if self.action == "list":
            qs = qs.annotate(interaction_count=Count("interactions"))

        # REGLA DE SEGURIDAD:
        # Si NO es administrador, solo puede ver los leads que tiene asignados.
        user = self.request.user
        if not user.is_staff:
            qs = qs.filter(assigned_to=user)

        # FILTROS PERSONALIZADOS:
        # 1. Leads Estancados (Sin actualizar en > 24h)
        filter_param = self.request.query_params.get("filter")

        if filter_param == "stale":
            stale_threshold = timezone.now() - timedelta(hours=24)
            qs = qs.exclude(
                status__in=[Lead.Status.CIERRE_GANADO, Lead.Status.CIERRE_PERDIDO]
            ).filter(updated_at__lt=stale_threshold)
        
        # 2. Leads de Hoy
        elif filter_param == "today":
            qs = qs.filter(created_at__date=timezone.now().date())

        return qs

    def perform_create(self, serializer):
        """
        Lógica extra al crear un lead manualmente desde el panel.
        """
        user = self.request.user
        # Si un vendedor crea un lead manualmente, se le asigna a él mismo automáticamente.
        if not user.is_staff:
            serializer.save(assigned_to=user)
        else:
            serializer.save()

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """
        Actualiza múltiples leads en una sola operación.
        Payload: { "ids": [...], "fields": { "status": "...", "assigned_to": ... } }
        """
        ids = request.data.get("ids", [])
        fields = request.data.get("fields", {})

        if not ids or not fields:
            return Response({"error": "IDs y campos requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        # Filtro de seguridad (reutiliza get_queryset para respetar RLS)
        leads_qs = self.get_queryset().filter(id__in=ids)
        
        # Para mantener el historial (django-simple-history), debemos guardar cada instancia
        # Si son muchos, esto puede ser lento, pero garantiza la integridad del log.
        updated_count = 0
        for lead in leads_qs:
            for key, value in fields.items():
                if key == 'assigned_to':
                    lead.assigned_to_id = value
                else:
                    setattr(lead, key, value)
            lead.save()
            updated_count += 1

        return Response({
            "message": f"Se actualizaron {updated_count} leads",
            "updated_count": updated_count
        })

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """
        Endpoint extra: GET /api/v1/leads/{id}/history/
        Consulta el registro de auditoría de cambios del lead.
        """
        lead = self.get_object()
        # Traemos los últimos 50 cambios realizados
        history_entries = lead.history.all()[:50]
        data = []
        for entry in history_entries:
            data.append({
                "history_id": entry.history_id,
                "history_date": entry.history_date,
                "history_type": entry.get_history_type_display(),
                "history_user": entry.history_user.username if entry.history_user else "Sistema",
                "changes": self._get_changes(entry), # Extrae qué campos cambiaron
            })
        return Response(data)

    def _get_changes(self, history_entry):
        """
        Método interno para calcular la diferencia entre dos versiones de un lead.
        """
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


class InteractionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Permite visualizar el timeline de eventos de un lead.
    """
    serializer_class = InteractionSerializer
    filterset_fields = ["lead", "source"]

    def get_queryset(self):
        # Cargamos relaciones para evitar múltiples consultas a la BD
        qs = Interaction.objects.select_related("source", "lead")
        
        # Filtro opcional por ID de lead
        lead_id = self.request.query_params.get("lead_id")
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        return qs


class LeadExportView(APIView):
    """
    Genera un archivo CSV descargable con la base de datos de leads.
    Respeta la privacidad: vendedores solo descargan sus propios leads.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Consulta base
        leads_qs = Lead.objects.all().order_by("-created_at")
        
        # Filtro de seguridad
        if not user.is_staff:
            leads_qs = leads_qs.filter(assigned_to=user)

        # Preparar respuesta como archivo CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads_export.csv"'

        writer = csv.writer(response)
        # Cabeceras del CSV
        writer.writerow([
            'ID', 'Email Original', 'Nombre', 'Apellido', 'Telefono',
            'Empresa', 'Estado', 'Vendedor', 'Fuente', 'Score', 'Fecha Creacion'
        ])

        # Escribir filas
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
