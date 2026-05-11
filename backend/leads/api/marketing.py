from django.http import HttpResponse
from rest_framework import viewsets, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from ..models import (
    Source, Campaign, Property, MediaAsset, LandingPage, LandingPageVisit, Lead
)
from ..serializers import (
    SourceSerializer, CampaignSerializer, PropertySerializer, 
    MediaAssetSerializer, LandingPageSerializer, LandingPageSubmitSerializer
)
from ..services import BrochureService, WebhookProcessor
from ..utils_pdf import generate_personalized_brochure

class SourceViewSet(viewsets.ModelViewSet):
    """Gestión de fuentes de leads (ej: Facebook, Web, Manual)."""
    queryset = Source.objects.all()
    serializer_class = SourceSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]


class CampaignViewSet(viewsets.ModelViewSet):
    """Gestión de campañas de marketing asociadas."""
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    filterset_fields = ["is_active"]
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny], url_path='brochure-preview')
    def brochure_preview(self, request, pk=None):
        """
        GET /api/v1/campaigns/{id}/brochure-preview/?token=...
        """
        token = request.query_params.get('token')
        user = BrochureService.validate_jwt_token(token)
        
        if not user:
            return HttpResponse("No autorizado: Token inválido o expirado", status=403)

        campaign = self.get_object()
        html = BrochureService.get_preview_html(campaign, user)
        
        response = HttpResponse(html)
        response["X-Frame-Options"] = "ALLOWALL" 
        return response

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def download_pdf(self, request, pk=None):
        """
        GET /api/v1/campaigns/{id}/download_pdf/?token=...
        """
        # 1. Autenticación (URL token o sesión)
        token = request.query_params.get('token')
        user = BrochureService.validate_jwt_token(token) if token else None
        
        if not user and request.user.is_authenticated:
            user = request.user
            
        if not user:
            return Response({"detail": "Se requiere autenticación"}, status=401)

        # 2. Generación via Servicio
        campaign = self.get_object()
        pdf_content, filename = BrochureService.generate_pdf_content(campaign, user)
        
        if pdf_content:
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = len(pdf_content)
            return response
            
        return Response({"error": "Error generando el PDF"}, status=500)


class PropertyViewSet(viewsets.ModelViewSet):
    """
    Controlador para gestionar el catálogo maestro de propiedades/proyectos.
    """
    queryset = Property.objects.all().select_related('main_image')
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "location"]
    search_fields = ["name", "location", "description"]
    ordering_fields = ["created_at", "min_investment"]


class MediaAssetViewSet(viewsets.ModelViewSet):
    """
    CRUD para gestionar imágenes y archivos de la biblioteca de medios.
    """
    queryset = MediaAsset.objects.all()
    serializer_class = MediaAssetSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]


class LandingPageViewSet(viewsets.ModelViewSet):
    """
    Controlador para que el administrador cree y edite Landing Pages.
    """
    queryset = LandingPage.objects.all().select_related('campaign', 'source')
    serializer_class = LandingPageSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.DjangoModelPermissions]

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
            
            # Guardar Perfil de Inversión
            lead.investment_goal = data.get('investment_goal', '')
            lead.investment_capacity = data.get('investment_capacity', '')
            
            lead.save()

        return Response(
            {"message": "¡Información recibida con éxito!", "success": True},
            status=status.HTTP_201_CREATED,
        )


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
