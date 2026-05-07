"""
Lead Flow - Admin
"""

from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import Lead, Source, Interaction, WebhookLog, VendorProfile, SessionAudit, Campaign, LandingPage, SentEmail


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "is_available_for_leads")
    list_filter = ("is_available_for_leads",)
    search_fields = ("user__username", "user__email")


@admin.register(SessionAudit)
class SessionAuditAdmin(admin.ModelAdmin):
    list_display = ("user", "login_at", "ip_address", "user_agent")
    list_filter = ("login_at", "user")
    search_fields = ("user__username", "ip_address")
    readonly_fields = ("user", "ip_address", "user_agent", "login_at")

@admin.register(Lead)
class LeadAdmin(SimpleHistoryAdmin):
    list_display = ["original_email", "first_name", "last_name", "status", "assigned_to", "created_at"]
    list_filter = ["status", "first_source", "assigned_to"]
    search_fields = ["original_email", "contact_email", "first_name", "last_name"]
    readonly_fields = ["original_email", "created_at", "updated_at"]


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "created_at"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "budget", "is_active", "start_date", "end_date", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    
    fieldsets = (
        ("Información General", {
            "fields": ("name", "slug", "budget", "is_active")
        }),
        ("Fechas", {
            "fields": ("start_date", "end_date")
        }),
        ("Contenido Brochure (PDF)", {
            "fields": ("brochure_title", "brochure_description", "brochure_features"),
            "description": "Configura el contenido del PDF dinámico que se genera para los leads."
        }),
    )


@admin.register(LandingPage)
class LandingPageAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "campaign", "source", "is_active", "created_at"]
    list_filter = ["is_active", "campaign"]
    search_fields = ["title", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    raw_id_fields = ["campaign", "source"]
    
    fieldsets = (
        ("Diseño & Identidad", {
            "fields": ("title", "slug", "primary_color", "image_url")
        }),
        ("Contenido Principal", {
            "fields": ("subtitle", "description")
        }),
        ("Beneficios (3 Columnas)", {
            "fields": (
                ("benefit_1_icon", "benefit_1_title"),
                ("benefit_2_icon", "benefit_2_title"),
                ("benefit_3_icon", "benefit_3_title")
            )
        }),
        ("Captura & Conversión", {
            "fields": ("cta_text", "success_message", "campaign", "source", "is_active")
        }),
    )


@admin.register(Interaction)
class InteractionAdmin(admin.ModelAdmin):
    list_display = ["lead", "source", "created_at"]
    list_filter = ["source"]


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ["source_type", "status", "lead", "created_at"]
    list_filter = ["status", "source_type"]
    readonly_fields = ["raw_body", "created_at"]


@admin.register(SentEmail)
class SentEmailAdmin(admin.ModelAdmin):
    list_display = ["subject", "to_email", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["to_email", "subject"]
    readonly_fields = ["created_at"]
