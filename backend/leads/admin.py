"""
Lead Flow - Admin Interface
===========================
Configuración del panel de administración nativo de Django.
Permite que el staff gestione datos maestros sin necesidad de usar el API.
"""

from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin # Para ver historial de cambios
from .models import (
    Lead, Source, Interaction, WebhookLog, VendorProfile, 
    SessionAudit, Campaign, LandingPage, SentEmail
)


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    """Gestión de disponibilidad de los vendedores."""
    list_display = ("user", "is_available_for_leads")
    list_filter = ("is_available_for_leads",)
    search_fields = ("user__username", "user__email")


@admin.register(SessionAudit)
class SessionAuditAdmin(admin.ModelAdmin):
    """Log de seguridad: Quién entró, cuándo y desde dónde."""
    list_display = ("user", "login_at", "ip_address", "user_agent")
    list_filter = ("login_at", "user")
    search_fields = ("user__username", "ip_address")
    # Los registros de auditoría son inalterables para mayor seguridad
    readonly_fields = ("user", "ip_address", "user_agent", "login_at")


@admin.register(Lead)
class LeadAdmin(SimpleHistoryAdmin):
    """
    Vista principal de prospectos.
    Usa SimpleHistoryAdmin para mostrar el botón 'History' con todos los cambios.
    """
    list_display = ["original_email", "first_name", "last_name", "status", "assigned_to", "created_at"]
    list_filter = ["status", "first_source", "assigned_to"]
    search_fields = ["original_email", "contact_email", "first_name", "last_name"]
    readonly_fields = ["original_email", "created_at", "updated_at"]


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    """Configuración de orígenes de datos (Facebook, Google, etc)."""
    list_display = ["name", "slug", "is_active", "created_at"]
    prepopulated_fields = {"slug": ("name",)} # Autocompleta el slug al escribir el nombre


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    """
    Configuración de campañas comerciales.
    Incluye los campos para la personalización del PDF Brochure.
    """
    list_display = ["name", "slug", "budget", "is_active", "start_date", "end_date", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    
    # Agrupamos los campos para que el formulario se vea ordenado
    fieldsets = (
        ("Información General", {
            "fields": ("name", "slug", "budget", "is_active")
        }),
        ("Fechas de Vigencia", {
            "fields": ("start_date", "end_date")
        }),
        ("Contenido del Brochure (PDF Personalizado)", {
            "fields": ("brochure_title", "brochure_description", "brochure_features"),
            "description": "Estos textos se inyectarán en el PDF que el cliente descarga."
        }),
    )


@admin.register(LandingPage)
class LandingPageAdmin(admin.ModelAdmin):
    """
    Configurador de Landing Pages dinámicas.
    Permite cambiar colores y textos sin programar.
    """
    list_display = ["title", "slug", "campaign", "source", "is_active", "created_at"]
    list_filter = ["is_active", "campaign"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    raw_id_fields = ["campaign", "source"] # Evita dropdowns gigantes
    
    fieldsets = (
        ("Diseño Visual", {
            "fields": ("title", "slug", "primary_color", "image_url", "image_asset")
        }),
        ("Textos de la Página", {
            "fields": ("subtitle", "description")
        }),
        ("Sección de Beneficios", {
            "fields": (
                ("benefit_1_icon", "benefit_1_title"),
                ("benefit_2_icon", "benefit_2_title"),
                ("benefit_3_icon", "benefit_3_title")
            )
        }),
        ("Estrategia de Captura", {
            "fields": ("cta_text", "success_message", "campaign", "source", "is_active")
        }),
    )


@admin.register(Interaction)
class InteractionAdmin(admin.ModelAdmin):
    """Timeline: Registro de cada vez que un lead llega o es contactado."""
    list_display = ["lead", "source", "type", "created_at"]
    list_filter = ["source", "type"]


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    """Log Técnico: Revisa qué JSON exacto nos envió Facebook o Zapier."""
    list_display = ["source_type", "status", "lead", "created_at"]
    list_filter = ["status", "source_type"]
    readonly_fields = ["raw_body", "created_at"]


@admin.register(SentEmail)
class SentEmailAdmin(admin.ModelAdmin):
    """Auditoría de correos enviados para transparencia comercial."""
    list_display = ["subject", "to_email", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["to_email", "subject"]
    readonly_fields = ["created_at"]
