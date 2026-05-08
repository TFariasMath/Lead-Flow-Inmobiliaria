"""
Lead Flow - API Views
=====================
Vistas DRF. Toda la lógica de negocio pesada reside en services.py.
Las vistas actúan como controladores que manejan:
- Serialización y validación de entrada.
- Permisos y seguridad.
- Respuestas HTTP y códigos de estado.

Seguridad implementada:
- Vendedores solo ven leads asignados a ellos (Row-Level Access).
- Staff/Admin tiene visibilidad total del sistema.
- El endpoint de webhook es público (AllowAny) para integraciones externas.
"""

import logging  # Para registro de eventos y errores en consola/logs

# Importaciones de Django para base de datos y modelos
from django.contrib.auth.models import User  # Modelo de usuario estándar
from django.db.models import Count, Q        # Herramientas para consultas complejas
from django.http import HttpResponse         # Para respuestas binarias (ej: PDF)

# Importaciones de Django Rest Framework (DRF)
from rest_framework import viewsets, status, permissions # Clases base para el API
from rest_framework.decorators import api_view, permission_classes, action # Decoradores de funciones
from rest_framework.response import Response # Objeto para devolver JSON
from rest_framework.views import APIView     # Clase base para vistas personalizadas
from rest_framework_simplejwt.views import TokenObtainPairView # Base para login JWT

# Importaciones locales (Modelos, Serializadores y Servicios)
from .models import (
    Lead, Source, Interaction, WebhookLog, Campaign, 
    LandingPage, SentEmail, MediaAsset, LandingPageVisit
)
from .utils_pdf import generate_personalized_brochure  # Utilidad para crear PDFs
from .serializers import (
    LeadListSerializer, LeadDetailSerializer, LeadCreateSerializer,
    SourceSerializer, CampaignSerializer, InteractionSerializer,
    WebhookLogSerializer, WebhookReceiveSerializer, ReprocessSerializer,
    LandingPageSerializer, LandingPageSubmitSerializer, MediaAssetSerializer,
    SentEmailSerializer, UserSerializer, DashboardStatsSerializer,
    CustomTokenObtainPairSerializer,
)
from .services import WebhookProcessor, ReprocessWebhook # Lógica centralizada

# Instancia de logger para esta aplicación
logger = logging.getLogger(__name__)


# ─── Auth / JWT (Control de Acceso) ──────────────────────────────────────────

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Controlador de autenticación personalizado.
    Extiende la lógica estándar de JWT para capturar datos de la sesión.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        """
        Sobreescribe el login exitoso para registrar una auditoría de seguridad.
        No bloquea el acceso si la auditoría falla.
        """
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            try:
                from .models import SessionAudit
                username = request.data.get("username")
                user = User.objects.filter(username=username).first()
                
                if user:
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                    ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    
                    # Auditamos de forma segura
                    SessionAudit.objects.create(
                        user=user,
                        ip_address=ip,
                        user_agent=user_agent
                    )
            except Exception as e:
                # Si falla la auditoría, logueamos el error pero NO bloqueamos al usuario
                logger.error(f"Error en auditoría de sesión: {e}")
                
        return response


# ─── Webhook Receive (Público / Entrada de Leads) ───────────────────────────

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


# ─── Lead ViewSet (Gestión de Prospectos) ────────────────────────────────────

class LeadViewSet(viewsets.ModelViewSet):
    """
    Controlador principal para el listado y edición de leads.
    Implementa seguridad de nivel de fila (Row-Level Security).
    """
    # Campos por los que se puede filtrar en la URL
    filterset_fields = ["status", "first_source", "assigned_to"]
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


# ─── Webhook Log ViewSet (Auditoría Técnica) ─────────────────────────────────

class WebhookLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Permite a los administradores inspeccionar la entrada de datos crudos.
    Incluye la capacidad de corregir y re-procesar webhooks fallidos.
    """
    serializer_class = WebhookLogSerializer
    permission_classes = [permissions.IsAdminUser] # Restringido a staff
    filterset_fields = ["status", "source_type"]
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
            edited_body=serializer.validated_data["edited_body"],
            user=request.user,
        )

        return Response(
            WebhookLogSerializer(result).data,
            status=status.HTTP_200_OK,
        )


# ─── Catálogos Auxiliares ────────────────────────────────────────────────────

class SourceViewSet(viewsets.ModelViewSet):
    """Gestión de fuentes de leads (ej: Facebook, Web, Manual)."""
    queryset = Source.objects.all()
    serializer_class = SourceSerializer


class CampaignViewSet(viewsets.ModelViewSet):
    """Gestión de campañas de marketing asociadas."""
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    filterset_fields = ["is_active"]


# ─── Historial / Timeline ───────────────────────────────────────────────────

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


# ─── Usuarios (Dropdowns de Asignación) ──────────────────────────────────────

class UserListView(APIView):
    """
    Lista simplificada de usuarios activos.
    Se usa para que el administrador pueda elegir a quién asignar un lead.
    """
    def get(self, request):
        users = User.objects.filter(is_active=True)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


# ─── Exportación de Datos ────────────────────────────────────────────────────

class LeadExportView(APIView):
    """
    Genera un archivo CSV descargable con la base de datos de leads.
    Respeta la privacidad: vendedores solo descargan sus propios leads.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        import csv
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


# ─── Estadísticas del Dashboard (KPIs) ───────────────────────────────────────

class DashboardStatsView(APIView):
    """
    Calcula los indicadores clave de rendimiento (KPIs) para la pantalla principal.
    """
    def get(self, request):
        user = request.user
        days = request.query_params.get('days')

        # Filtrar el universo de leads según quién consulta
        leads_qs = Lead.objects.all()

        if days and days.isdigit():
            from django.utils import timezone
            from datetime import timedelta
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

        # Análisis de origen: ¿De dónde vienen los clientes?
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


# ─── Análisis de Rendimiento (Vendedores) ───────────────────────────────────

class PerformanceAnalyticsView(APIView):
    """
    Compara el rendimiento de cierre entre distintos vendedores.
    Exclusivo para administradores.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        # Solo consideramos usuarios activos que no son administradores (vendedores)
        vendors = User.objects.filter(is_active=True, is_staff=False)
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



# ─── Media & Landings (Pro) ──────────────────────────────────────────────────

# ─── Biblioteca de Medios y Landing Pages (Gestión) ──────────────────────────

class MediaAssetViewSet(viewsets.ModelViewSet):
    """
    CRUD para gestionar imágenes y archivos de la biblioteca de medios.
    """
    queryset = MediaAsset.objects.all()
    serializer_class = MediaAssetSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


class LandingPageViewSet(viewsets.ModelViewSet):
    """
    Controlador para que el administrador cree y edite Landing Pages.
    """
    queryset = LandingPage.objects.all().select_related('campaign', 'source')
    serializer_class = LandingPageSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """
        GET /api/v1/landings/{id}/analytics/
        Retorna métricas de rendimiento específicas de esta página.
        """
        landing = self.get_object()
        return Response({
            "visits": landing.visits_count,
            "leads": Lead.objects.filter(source=landing.source).count(),
            "conversion_rate": landing.conversion_rate
        })

# ─── Landing Pages (Públicas) ─────────────────────────────────────────────────

# ─── Vistas Públicas (Para el Cliente Final) ───────────────────────────────

class LandingPageDetailView(APIView):
    """
    Endpoint público que entrega la configuración de una Landing Page.
    Registra automáticamente una visita detallada (IP, Navegador).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            landing = LandingPage.objects.select_related('campaign', 'source').get(
                slug=slug, is_active=True
            )
        except LandingPage.DoesNotExist:
            return Response(
                {"error": "Landing Page no encontrada o inactiva."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Incrementar contador básico de visitas
        landing.visits_count += 1
        landing.save(update_fields=['visits_count'])
        
        # Guardar log de auditoría de la visita
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
        
        LandingPageVisit.objects.create(
            landing_page=landing,
            ip_address=ip,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            referer=request.META.get('HTTP_REFERER', '')
        )

        return Response(LandingPageSerializer(landing).data)


class LandingPageSubmitView(APIView):
    """
    Recibe los datos del formulario de una Landing Page.
    Procesa el lead, lo asigna mediante Round Robin y guarda UTMs.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug):
        try:
            landing = LandingPage.objects.select_related('campaign', 'source').get(
                slug=slug, is_active=True
            )
        except LandingPage.DoesNotExist:
            return Response({"error": "Landing inactiva."}, status=status.HTTP_404_NOT_FOUND)

        serializer = LandingPageSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data.pop('email').lower().strip()

        # Delegar la creación del lead al procesador de Webhooks (unificando lógica)
        source_slug = landing.source.slug if landing.source else 'landing-page'
        raw_body = {
            'email': email,
            **{k: v for k, v in data.items() if v},
            'landing_slug': slug,
        }

        processor = WebhookProcessor(source_type=source_slug, raw_body=raw_body)
        processor.create_log()
        result = processor.process()

        # Si el lead se creó o actualizó con éxito, inyectamos datos de campaña
        if result.status == 'success' and result.lead:
            lead = result.lead
            lead.campaign = landing.campaign
            # Guardar parámetros de tracking de marketing (UTMs)
            lead.utm_source = data.get('utm_source', '')
            lead.utm_medium = data.get('utm_medium', '')
            lead.utm_campaign = data.get('utm_campaign', '')
            lead.utm_term = data.get('utm_term', '')
            lead.utm_content = data.get('utm_content', '')
            lead.save()

        return Response(
            {"message": "¡Información recibida con éxito!", "success": True},
            status=status.HTTP_201_CREATED,
        )


# ─── Auditoría de Comunicaciones ─────────────────────────────────────────────

class SentEmailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualizar los correos electrónicos enviados.
    Útil para que el vendedor vea qué se le ha enviado al cliente.
    """
    queryset = SentEmail.objects.all()
    serializer_class = SentEmailSerializer
    filterset_fields = ["lead", "to_email", "status"]
    search_fields = ["subject", "to_email", "body_text"]


# ─── Generación de Documentación (PDF) ───────────────────────────────────────

class LeadBrochureView(APIView):
    """
    Endpoint que genera dinámicamente un brochure PDF personalizado.
    Lo utiliza el cliente desde un link enviado a su correo.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, lead_id):
        try:
            # Obtener datos del lead y su campaña
            lead = Lead.objects.select_related('campaign', 'assigned_to').get(id=lead_id)
        except Lead.DoesNotExist:
            return Response({"error": "Lead no encontrado"}, status=404)
        
        if not lead.campaign:
            return Response({"error": "Este lead no tiene una campaña asociada."}, status=400)
            
        # Generar el PDF usando la utilidad especializada
        pdf_content = generate_personalized_brochure(lead, lead.campaign)
        
        if pdf_content:
            response = HttpResponse(pdf_content, content_type='application/pdf')
            # Forzar la descarga con un nombre de archivo amigable
            filename = f"Brochure_{lead.first_name or 'Inversionista'}_{lead.campaign.slug}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        return Response({"error": "Error técnico generando el documento."}, status=500)

