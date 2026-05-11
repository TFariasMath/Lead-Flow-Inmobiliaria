"""
Lead Flow - Serializers
=======================
Transforman los modelos de base de datos en JSON para el frontend
y validan la entrada de datos que viene del exterior.
"""

from django.contrib.auth.models import User, Group, Permission
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Lead, Source, Interaction, WebhookLog, Campaign, LandingPage, SentEmail, MediaAsset, Property


# ─── Catálogos de Marketing ──────────────────────────────────────────────────

class SourceSerializer(serializers.ModelSerializer):
    """Representación de una fuente de origen (ej: Facebook Ads)."""
    class Meta:
        model = Source
        fields = ["id", "name", "slug", "description", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class PropertySerializer(serializers.ModelSerializer):
    """Representación de una propiedad o proyecto inmobiliario."""
    main_image_url = serializers.ImageField(source="main_image.file", read_only=True)
    campaign_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            "id", "name", "slug", "description", "location",
            "latitude", "longitude",
            "min_investment", "estimated_return", "delivery_date",
            "amenities", "main_image", "main_image_url", "is_active", 
            "campaign_name", "location", "address",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_campaign_name(self, obj):
        campaign = obj.campaigns.first()
        return campaign.name if campaign else "Sin Proyecto"


class CampaignSerializer(serializers.ModelSerializer):
    """Representación de una campaña comercial (ej: Inversión 2024)."""
    properties_details = PropertySerializer(source="properties", many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "id", "name", "slug", "budget", "is_active", 
            "start_date", "end_date", "properties", "properties_details", 
            "brochure_title", "brochure_description", "brochure_features",
            "created_at"
        ]
        read_only_fields = ["id", "created_at"]


# ─── Historial de Eventos ────────────────────────────────────────────────────

class InteractionSerializer(serializers.ModelSerializer):
    """
    Representa un evento en la vida de un lead.
    Muestra el nombre de la fuente de forma legible.
    """
    source_name = serializers.CharField(source="source.name", read_only=True)

    class Meta:
        model = Interaction
        fields = [
            "id", "lead", "source", "source_name",
            "raw_payload", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# ─── Gestión de Leads ─────────────────────────────────────────────────────────

class LeadListSerializer(serializers.ModelSerializer):
    """
    Versión ligera del Lead para tablas y listados.
    Incluye nombres de relaciones para evitar IDs crudos en el UI.
    """
    assigned_to_name = serializers.SerializerMethodField()
    first_source_name = serializers.CharField(
        source="first_source.name", read_only=True, default=""
    )
    campaign_name = serializers.CharField(
        source="campaign.name", read_only=True, default=""
    )
    # Este campo viene de una anotación en el QuerySet (Count interacciones)
    interaction_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id", "original_email", "contact_email",
            "first_name", "last_name", "phone", "company",
            "status", "assigned_to", "assigned_to_name",
            "first_source", "first_source_name",
            "campaign", "campaign_name", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
            "interested_properties",
            "interaction_count", "score",
            "investment_goal", "investment_capacity",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "original_email", "score", "created_at", "updated_at"]

    def get_assigned_to_name(self, obj):
        """Formatea el nombre del vendedor asignado."""
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return "Sin Asignar"


class LeadDetailSerializer(serializers.ModelSerializer):
    """
    Versión completa del Lead para la vista de detalle.
    Incluye todo el timeline de interacciones anidado.
    """
    interactions = InteractionSerializer(many=True, read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    first_source_name = serializers.CharField(
        source="first_source.name", read_only=True, default=""
    )
    campaign_name = serializers.CharField(
        source="campaign.name", read_only=True, default=""
    )

    class Meta:
        model = Lead
        fields = [
            "id", "original_email", "contact_email",
            "first_name", "last_name", "phone",
            "address", "company",
            "status", "assigned_to", "assigned_to_name",
            "first_source", "first_source_name",
            "campaign", "campaign_name", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
            "interested_properties",
            "interactions", "score",
            "investment_goal", "investment_capacity",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "original_email", "score", "created_at", "updated_at"]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None

    def __init__(self, *args, **kwargs):
        """
        Seguridad dinámica:
        Si el usuario NO es staff, el campo 'assigned_to' se vuelve solo lectura.
        Esto evita que un vendedor se 'robe' leads asignados a otros.
        """
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and not request.user.is_staff:
            self.fields["assigned_to"].read_only = True


class LeadCreateSerializer(serializers.ModelSerializer):
    """
    Se utiliza para la creación manual de leads desde el dashboard.
    Incluye validación de duplicados y normalización de emails.
    """
    class Meta:
        model = Lead
        fields = [
            "original_email", "contact_email",
            "first_name", "last_name", "phone",
            "address", "company",
            "status", "assigned_to", "first_source", "score",
            "campaign", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
            "interested_properties",
            "investment_goal", "investment_capacity"
        ]
        read_only_fields = ["score"]

    def validate_original_email(self, value):
        """Evita crear dos veces el mismo lead por error humano."""
        if Lead.objects.filter(original_email=value.lower()).exists():
            raise serializers.ValidationError(
                "Ya existe un lead con este email. Usa el buscador para encontrarlo."
            )
        return value.lower()

    def create(self, validated_data):
        # Si no se especifica un email de contacto, usamos el original por defecto
        if not validated_data.get("contact_email"):
            validated_data["contact_email"] = validated_data["original_email"]
        return super().create(validated_data)

    def __init__(self, *args, **kwargs):
        """Restricción de asignación: Vendedores no pueden asignar leads a otros."""
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and not request.user.is_staff:
            self.fields["assigned_to"].read_only = True


# ─── Infraestructura de Webhooks ─────────────────────────────────────────────

class WebhookLogSerializer(serializers.ModelSerializer):
    """
    Serializador para la auditoría técnica de webhooks.
    Muestra quién editó y qué lead se generó a partir del log.
    """
    lead_name = serializers.CharField(source="lead.__str__", read_only=True, default="")
    edited_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WebhookLog
        fields = [
            "id", "source_type", "raw_body", "status",
            "error_message", "lead", "lead_name",
            "edited_body", "edited_by", "edited_by_name",
            "processed_at", "created_at",
        ]
        read_only_fields = [
            "id", "source_type", "raw_body", "status",
            "error_message", "lead", "processed_at", "created_at",
        ]

    def get_edited_by_name(self, obj):
        if obj.edited_by:
            return obj.edited_by.username
        return None


class ReprocessSerializer(serializers.Serializer):
    """Esquema de datos para corregir un webhook fallido."""
    edited_body = serializers.DictField(required=False, allow_null=True)


class WebhookReceiveSerializer(serializers.Serializer):
    """Validación mínima del payload de webhook entrante."""
    source_type = serializers.CharField(max_length=100)
    data = serializers.DictField()


# ─── Landing Pages & Multimedia ──────────────────────────────────────────────

class MediaAssetSerializer(serializers.ModelSerializer):
    """Manejo de archivos de imagen para las landings."""
    class Meta:
        model = MediaAsset
        fields = ["id", "title", "file", "alt_text", "created_at"]


class LandingPageSerializer(serializers.ModelSerializer):
    """
    Serializador para el constructor visual de Landing Pages.
    Incluye métricas de rendimiento calculadas.
    """
    campaign_name = serializers.ReadOnlyField(source="campaign.name")
    source_name = serializers.ReadOnlyField(source="source.name")
    conversion_rate = serializers.ReadOnlyField()
    properties_details = PropertySerializer(source="campaign.properties", many=True, read_only=True)

    class Meta:
        model = LandingPage
        fields = [
            "id", "title", "slug", "subtitle", "description",
            "benefits", "form_config",
            "cta_text", "success_message",
            "primary_color", "image_url", "image_asset",
            "latitude", "longitude",
            "campaign", "campaign_name", "source", "source_name",
            "properties_details",
            "visits_count", "conversion_rate",
            "is_active", "created_at",
        ]


class LandingPageSubmitSerializer(serializers.Serializer):
    """
    Valida los datos que vienen desde el formulario público de una landing.
    Incluye captura de parámetros UTM para atribución de marketing.
    """
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")
    phone = serializers.CharField(max_length=50, required=False, default="")
    company = serializers.CharField(max_length=200, required=False, default="")
    utm_source = serializers.CharField(max_length=200, required=False, default="")
    utm_medium = serializers.CharField(max_length=200, required=False, default="")
    utm_campaign = serializers.CharField(max_length=200, required=False, default="")
    utm_term = serializers.CharField(max_length=200, required=False, default="")
    utm_content = serializers.CharField(max_length=200, required=False, default="")
    investment_goal = serializers.CharField(max_length=100, required=False, default="")
    investment_capacity = serializers.CharField(max_length=100, required=False, default="")


# ─── Otros Serializadores ───────────────────────────────────────────────────

class SentEmailSerializer(serializers.ModelSerializer):
    """Historial de correos enviados para auditoría del CRM."""
    class Meta:
        model = SentEmail
        fields = [
            "id", "lead", "to_email", "from_email",
            "subject", "body_text", "body_html",
            "status", "error_message", "created_at"
        ]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    """Información completa del usuario/vendedor."""
    group_names = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name',
        source='groups'
    )

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "is_staff", "groups", "group_names", "password"]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'groups': {'required': False}
        }


class DashboardStatsSerializer(serializers.Serializer):
    """Esquema de respuesta para las métricas globales del dashboard."""
    total_leads = serializers.IntegerField()
    leads_by_status = serializers.DictField()
    total_webhooks = serializers.IntegerField()
    successful_webhooks = serializers.IntegerField()
    failed_webhooks = serializers.IntegerField()
    webhook_success_rate = serializers.FloatField()
    leads_by_source = serializers.ListField()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extiende el token JWT para incluir datos del perfil del usuario.
    Esto permite que el frontend sepa el nombre del usuario sin hacer otra petición.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Inyectar claims personalizados en el payload del token
        token['is_staff'] = user.is_staff
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['username'] = user.username
        
        # Lista de nombres de grupos (Roles)
        token['groups'] = list(user.groups.values_list('name', flat=True))
        
        # Lista de permisos (ej: 'leads.view_lead')
        # Solo incluimos los de la app 'leads' para no inflar el token
        perms = user.get_all_permissions()
        token['permissions'] = [p for p in perms if p.startswith('leads.')]

        return token


class PermissionSerializer(serializers.ModelSerializer):
    """Representación de un permiso del sistema."""
    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "content_type"]


class GroupSerializer(serializers.ModelSerializer):
    """Representación de un Rol (Grupo) con sus permisos."""
    permissions_details = PermissionSerializer(source="permissions", many=True, read_only=True)
    user_count = serializers.IntegerField(source="user_set.count", read_only=True)

    class Meta:
        model = Group
        fields = ["id", "name", "permissions", "permissions_details", "user_count"]
