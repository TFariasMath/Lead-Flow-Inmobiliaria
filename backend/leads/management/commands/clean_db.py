from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from leads.models import (
    Source, Campaign, Property, LandingPage, LandingPageVisit,
    Lead, Interaction, SentEmail, WebhookLog, MediaAsset,
    SessionAudit, RoundRobinState, SystemAlert
)
import os

class Command(BaseCommand):
    help = 'Limpia todos los datos del CRM (Leads, Campañas, Propiedades, etc.) manteniendo solo los Usuarios.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Ejecuta la limpieza sin pedir confirmación.',
        )

    def handle(self, *args, **options):
        if not options['force']:
            self.stdout.write(self.style.WARNING("¡ADVERTENCIA! Esto borrará todos los datos de negocio (Leads, Propiedades, Campañas, etc.)."))
            confirm = input("¿Estás seguro de que deseas continuar? (y/N): ")
            if confirm.lower() != 'y':
                self.stdout.write(self.style.ERROR("Operación cancelada."))
                return

        self.stdout.write(self.style.MIGRATE_HEADING("--- Iniciando Limpieza Profunda ---"))

        # Lista de modelos a limpiar en orden de dependencia (o simplemente aprovechar CASCADE)
        # 1. Datos Transaccionales e Historial
        self.clean_model(Interaction, "Interacciones")
        self.clean_model(LandingPageVisit, "Visitas a Landings")
        self.clean_model(SentEmail, "Emails Enviados")
        self.clean_model(WebhookLog, "Logs de Webhooks")
        self.clean_model(SystemAlert, "Alertas del Sistema")
        self.clean_model(SessionAudit, "Auditorías de Sesión")
        self.clean_model(RoundRobinState, "Estado de Round Robin")
        
        # 2. El Corazón del Negocio
        self.clean_model(Lead, "Leads")
        
        # 3. Estructura y Catálogos
        self.clean_model(LandingPage, "Landing Pages")
        self.clean_model(Campaign, "Campañas")
        self.clean_model(Property, "Propiedades")
        self.clean_model(Source, "Fuentes")
        
        # 4. Archivos y Media
        self.clean_model(MediaAsset, "Archivos Media")

        # Nota: Los perfiles de vendedor (VendorProfile) están atados a User vía CASCADE.
        # Al no borrar User, los perfiles se mantienen.

        self.stdout.write(self.style.SUCCESS("\n[OK] Base de datos limpia. Los usuarios administradores y vendedores han sido preservados."))

    def clean_model(self, model, label):
        count = model.objects.all().count()
        if count > 0:
            model.objects.all().delete()
            self.stdout.write(f"  - Eliminados {count} registros de {label}")
        else:
            self.stdout.write(f"  - {label} ya estaba vacío.")
