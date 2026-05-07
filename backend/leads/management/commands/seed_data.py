"""
Lead Flow - Management Command: Seed Data
=========================================
Comando de consola para inicializar la base de datos con datos de prueba.
Uso: python manage.py seed_data
"""

import logging
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from leads.models import Source

# Logger para reportar errores en la consola
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    """
    Carga el superusuario, vendedores y fuentes de origen por defecto.
    Garantiza que el sistema sea funcional inmediatamente después de instalarlo.
    """
    help = 'Inicializa la base de datos con vendedores y fuentes de ejemplo.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("--- Iniciando Proceso de Sembrado (Seed) ---"))

        # 1. Crear Administrador Principal
        # Se asegura de que siempre haya un usuario staff para entrar al panel /admin
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                email="admin@leadflow.dev",
                password="admin123",
                first_name="Administrador",
                last_name="General",
            )
            self.stdout.write(self.style.SUCCESS("✅ Superusuario 'admin' creado (Pass: admin123)"))

        # 2. Crear Equipo de Ventas
        # Estos usuarios recibirán los leads a través del sistema Round Robin.
        vendors = [
            {"username": "vendedor1", "first_name": "María", "last_name": "García", "email": "maria@leadflow.dev"},
            {"username": "vendedor2", "first_name": "Carlos", "last_name": "López", "email": "carlos@leadflow.dev"},
            {"username": "vendedor3", "first_name": "Ana", "last_name": "Martínez", "email": "ana@leadflow.dev"},
        ]

        for v in vendors:
            # get_or_create evita duplicados si el comando se corre varias veces
            user, created = User.objects.get_or_create(
                username=v["username"],
                defaults={
                    "first_name": v["first_name"],
                    "last_name": v["last_name"],
                    "email": v["email"],
                    "is_staff": False,
                },
            )
            if created:
                user.set_password("vendedor123")
                user.save()
                self.stdout.write(self.style.SUCCESS(f"✅ Vendedor '{v['username']}' configurado."))
            else:
                # Si ya existía, forzamos la actualización de nombres (por si hubo cambios en el script)
                user.first_name = v["first_name"]
                user.last_name = v["last_name"]
                user.save()
                self.stdout.write(f"ℹ️ Vendedor '{v['username']}' ya existía (nombres actualizados).")

        # 3. Crear Fuentes de Origen
        # Define los canales por los cuales pueden entrar los prospectos.
        sources = [
            {"name": "Sitio Web", "slug": "web", "description": "Formulario de contacto oficial"},
            {"name": "Facebook Ads", "slug": "facebook", "description": "Campañas de generación de clientes potenciales"},
            {"name": "Google Search", "slug": "google", "description": "Búsqueda orgánica en buscadores"},
            {"name": "Manual", "slug": "manual", "description": "Ingreso directo por el vendedor"},
        ]

        for s in sources:
            source, created = Source.objects.get_or_create(
                slug=s["slug"],
                defaults={"name": s["name"], "description": s["description"]},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Fuente '{s['name']}' habilitada."))

        self.stdout.write(self.style.MIGRATE_LABEL("\n🚀 ¡Ambiente de trabajo listo para usar!"))
