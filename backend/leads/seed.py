"""
Lead Flow - Seed Data
=====================
Script para crear datos iniciales: superusuario, vendedores, y fuentes.
Ejecutar con: python manage.py shell < leads/seed.py
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from leads.models import Source

# ── Crear superusuario ────────────────────────────────────────────────────────
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser(
        username="admin",
        email="admin@leadflow.dev",
        password="admin123",
        first_name="Admin",
        last_name="LeadFlow",
    )
    print("✅ Superusuario 'admin' creado (password: admin123)")

# ── Crear vendedores de prueba ────────────────────────────────────────────────
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
        print(f"✅ Vendedor '{v['username']}' creado (password: vendedor123)")

# ── Crear fuentes ────────────────────────────────────────────────────────────
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
        print(f"✅ Fuente '{s['name']}' creada")

print("\n🎉 Datos semilla cargados exitosamente.")
