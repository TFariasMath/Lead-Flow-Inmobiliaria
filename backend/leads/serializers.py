"""
Lead Flow - Serializers
=======================
Serializadores DRF para la API REST.
"""

from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Lead, Source, Interaction, WebhookLog, Campaign, LandingPage, SentEmail


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ["id", "name", "slug", "description", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["id", "name", "slug", "budget", "is_active", "start_date", "end_date", "created_at"]
        read_only_fields = ["id", "created_at"]


class InteractionSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source="source.name", read_only=True)

    class Meta:
        model = Interaction
        fields = [
            "id", "lead", "source", "source_name",
            "raw_payload", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class LeadListSerializer(serializers.ModelSerializer):
    """Serializer compacto para la vista de lista."""
    assigned_to_name = serializers.SerializerMethodField()
    first_source_name = serializers.CharField(
        source="first_source.name", read_only=True, default=""
    )
    campaign_name = serializers.CharField(
        source="campaign.name", read_only=True, default=""
    )
    interaction_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id", "original_email", "contact_email",
            "first_name", "last_name", "phone",
            "status", "assigned_to", "assigned_to_name",
            "first_source", "first_source_name",
            "campaign", "campaign_name", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
            "interaction_count", "score",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "original_email", "score", "created_at", "updated_at"]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None


class LeadDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para la vista de detalle con timeline."""
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
            "interactions", "score",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "original_email", "score", "created_at", "updated_at"]

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and not request.user.is_staff:
            self.fields["assigned_to"].read_only = True


class LeadCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación manual de leads (formulario)."""

    class Meta:
        model = Lead
        fields = [
            "original_email", "contact_email",
            "first_name", "last_name", "phone",
            "address", "company",
            "status", "assigned_to", "first_source", "score",
            "campaign", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        ]
        read_only_fields = ["score"]

    def validate_original_email(self, value):
        if Lead.objects.filter(original_email=value.lower()).exists():
            raise serializers.ValidationError(
                "Ya existe un lead con este email. Busca el lead existente en vez de crear uno nuevo."
            )
        return value.lower()

    def create(self, validated_data):
        # Si no se provee contact_email, usar el original
        if not validated_data.get("contact_email"):
            validated_data["contact_email"] = validated_data["original_email"]
        return super().create(validated_data)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and not request.user.is_staff:
            self.fields["assigned_to"].read_only = True


class WebhookLogSerializer(serializers.ModelSerializer):
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


class WebhookReceiveSerializer(serializers.Serializer):
    """Validación mínima del payload de webhook entrante."""
    source_type = serializers.CharField(max_length=100)
    data = serializers.DictField()


class ReprocessSerializer(serializers.Serializer):
    """Para el re-procesamiento de webhooks fallidos."""
    edited_body = serializers.DictField()


class MediaAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaAsset
        fields = ["id", "title", "file", "alt_text", "created_at"]


class LandingPageSerializer(serializers.ModelSerializer):
    campaign_name = serializers.ReadOnlyField(source="campaign.name")
    source_name = serializers.ReadOnlyField(source="source.name")
    conversion_rate = serializers.ReadOnlyField()

    class Meta:
        model = LandingPage
        fields = [
            "id", "title", "slug", "subtitle", "description",
            "benefits", "form_config",
            "cta_text", "success_message",
            "primary_color", "image_url", "image_asset",
            "campaign", "campaign_name", "source", "source_name",
            "visits_count", "conversion_rate",
            "is_active", "created_at",
        ]


class LandingPageSubmitSerializer(serializers.Serializer):
    """Validación del formulario público de Landing Page."""
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


class SentEmailSerializer(serializers.ModelSerializer):
    """Serializer para el visor de correos enviados."""
    class Meta:
        model = SentEmail
        fields = [
            "id", "lead", "to_email", "from_email",
            "subject", "body_text", "body_html",
            "status", "error_message", "created_at"
        ]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    """Serializer básico de usuarios (vendedores)."""
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "is_staff"]
        read_only_fields = fields


class DashboardStatsSerializer(serializers.Serializer):
    """Estadísticas del dashboard."""
    total_leads = serializers.IntegerField()
    leads_by_status = serializers.DictField()
    total_webhooks = serializers.IntegerField()
    successful_webhooks = serializers.IntegerField()
    failed_webhooks = serializers.IntegerField()
    webhook_success_rate = serializers.FloatField()
    leads_by_source = serializers.ListField()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Inyectar campos personalizados en el token
        token['is_staff'] = user.is_staff
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['username'] = user.username

        return token

