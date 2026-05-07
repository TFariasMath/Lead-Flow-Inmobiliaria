"""
Lead Flow - Admin
"""

from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import Lead, Source, Interaction, WebhookLog, VendorProfile, SessionAudit


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


@admin.register(Interaction)
class InteractionAdmin(admin.ModelAdmin):
    list_display = ["lead", "source", "created_at"]
    list_filter = ["source"]


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ["source_type", "status", "lead", "created_at"]
    list_filter = ["status", "source_type"]
    readonly_fields = ["raw_body", "created_at"]
