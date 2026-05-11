import logging
from rest_framework import viewsets, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from ..models import WebhookLog
from ..serializers import (
    WebhookLogSerializer, ReprocessSerializer
)
from ..services import WebhookProcessor, ReprocessWebhook

logger = logging.getLogger(__name__)

class WebhookReceiveView(APIView):
    """
    Endpoint para capturar leads externos (Zapier, Meta, formularios).
    
    Características:
    - Es público (AllowAny): No requiere login.
    - Es asíncrono: Delega el trabajo pesado a Django Q para responder rápido.
    - Es tolerante: Acepta casi cualquier JSON y lo guarda para revisión.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = [] # Desactiva autenticación JWT para este endpoint

    def post(self, request):
        """
        Punto de entrada para el POST del webhook.
        """
        raw_payload = request.data
        
        # Robustez: Si nos envían una lista [] o algo que no sea un objeto {}, 
        # lo manejamos como un payload genérico sin explotar.
        if not isinstance(raw_payload, dict):
            source_type = "unknown"
            data = {"raw_list": raw_payload} if isinstance(raw_payload, list) else {"raw_data": str(raw_payload)}
        else:
            source_type = raw_payload.get("source_type", "unknown")
            data = raw_payload.get("data", raw_payload)

        # 1. Registrar la llegada del webhook en la BD inmediatamente
        processor = WebhookProcessor(source_type=source_type, raw_body=data)
        webhook_log = processor.create_log()

        # 2. Disparar la tarea en segundo plano (Worker)
        # Esto permite que el servidor externo (ej. Facebook) reciba un 200 OK
        # sin esperar a que nosotros procesemos toda la lógica de negocio.
        from django_q.tasks import async_task
        async_task('leads.tasks.process_webhook_task', str(webhook_log.id))

        return Response(
            {
                "status": "received",
                "webhook_log_id": str(webhook_log.id),
                "processing_status": "pending",
            },
            status=status.HTTP_200_OK,
        )


class WebhookLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Permite a los administradores inspeccionar la entrada de datos crudos.
    Incluye la capacidad de corregir y re-procesar webhooks fallidos.
    """
    serializer_class = WebhookLogSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]
    # Motores de filtrado activados
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "source_type"]
    search_fields = ["raw_body", "error_message"]
    ordering_fields = ["created_at", "status"]

    def get_queryset(self):
        return WebhookLog.objects.select_related("lead", "edited_by")

    @action(detail=True, methods=["post"])
    def reprocess(self, request, pk=None):
        """
        POST /api/v1/webhook-logs/{id}/reprocess/
        Permite editar un JSON que llegó mal y volver a intentar la creación del lead.
        """
        webhook_log = self.get_object()

        # Solo tiene sentido re-procesar si falló antes
        if webhook_log.status != WebhookLog.Status.FAILED:
            return Response(
                {"error": "Solo se pueden re-procesar webhooks con estado 'Failed'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar que el nuevo JSON sea válido
        serializer = ReprocessSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Ejecutar la lógica de re-procesamiento definida en services.py
        result = ReprocessWebhook.reprocess(
            webhook_log=webhook_log,
            edited_body=serializer.validated_data.get("edited_body"),
            user=request.user,
        )

        return Response(
            WebhookLogSerializer(result).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def bulk_reprocess(self, request):
        """
        POST /api/v1/webhook-logs/bulk_reprocess/
        Recibe una lista de IDs y los intenta procesar todos.
        """
        log_ids = request.data.get("log_ids", [])
        if not log_ids:
            return Response({"error": "No se enviaron IDs."}, status=status.HTTP_400_BAD_REQUEST)
        
        results = ReprocessWebhook.bulk_reprocess(log_ids, user=request.user)
        return Response(results, status=status.HTTP_200_OK)
