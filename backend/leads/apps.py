from django.apps import AppConfig


class LeadsConfig(AppConfig):
    """Configuración principal del módulo de gestión de prospectos."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "leads"
    
    # Nombre que aparecerá en el encabezado del panel /admin
    verbose_name = "CRM - Gestión de Leads"
