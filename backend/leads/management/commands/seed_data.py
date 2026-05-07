import logging
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from leads.models import Source

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Carga datos iniciales (vendedores y fuentes) con soporte UTF-8 garantizado.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("--- Iniciando Carga de Datos (Seed) ---"))

        # 1. Superusuario
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                email="admin@leadflow.dev",
                password="admin123",
                first_name="Admin",
                last_name="LeadFlow",
            )
            self.stdout.write(self.style.SUCCESS("✅ Superusuario 'admin' creado (pass: admin123)"))

        # 2. Vendedores (Datos con acentos)
        vendors = [
            {"username": "vendedor1", "first_name": "María", "last_name": "García", "email": "maria@leadflow.dev"},
            {"username": "vendedor2", "first_name": "Carlos", "last_name": "López", "email": "carlos@leadflow.dev"},
            {"username": "vendedor3", "first_name": "Ana", "last_name": "Martínez", "email": "ana@leadflow.dev"},
        ]

        for v in vendors:
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
                self.stdout.write(self.style.SUCCESS(f"✅ Vendedor '{v['username']}' creado: {v['first_name']} {v['last_name']}"))
            else:
                # Si ya existe, actualizamos por si acaso hubo error de encoding previo
                user.first_name = v["first_name"]
                user.last_name = v["last_name"]
                user.save()
                self.stdout.write(f"ℹ️ Vendedor '{v['username']}' actualizado para corregir nombres.")

        # 3. Fuentes
        sources = [
            {"name": "Web", "slug": "web", "description": "Formulario de contacto del sitio web"},
            {"name": "Calendly", "slug": "calendly", "description": "Reservas de citas desde Calendly"},
            {"name": "Mailchimp", "slug": "mailchimp", "description": "Suscripciones desde campañas de Mailchimp"},
            {"name": "Manual", "slug": "manual", "description": "Ingreso manual por parte del equipo comercial"},
        ]

        for s in sources:
            source, created = Source.objects.get_or_create(
                slug=s["slug"],
                defaults={"name": s["name"], "description": s["description"]},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Fuente '{s['name']}' creada."))

        self.stdout.write(self.style.MIGRATE_LABEL("\n🎉 Carga de datos completada exitosamente."))
