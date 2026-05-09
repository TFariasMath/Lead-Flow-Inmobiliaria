"""
Lead Flow - Management Command: Seed Data (PRO Version)
=====================================================
Puebla la base de datos con un historial masivo de 90 días.
Simula leads, visitas, conversiones e interacciones.
"""

import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from leads.models import Source, Campaign, LandingPage, Lead, Interaction, LandingPageVisit, Property

class Command(BaseCommand):
    help = 'Puebla la base de datos con 90 días de datos históricos realistas.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("--- Generando Datos Históricos Pro (90 días) ---"))

        # 1. Usuarios Base
        admin, _ = User.objects.get_or_create(username="admin", defaults={"is_staff": True, "is_superuser": True})
        admin.set_password("123")
        admin.save()

        vendedores = []
        for name in ["Maria", "Carlos", "Ana"]:
            user, _ = User.objects.get_or_create(username=name.lower(), defaults={"first_name": name, "is_staff": False})
            user.set_password("123")
            user.save()
            vendedores.append(user)

        # 2. Fuentes
        sources = {}
        for s_info in [
            {"name": "Facebook Ads", "slug": "facebook"},
            {"name": "Google Search", "slug": "google"},
            {"name": "Instagram", "slug": "instagram"},
            {"name": "Directo", "slug": "direct"},
        ]:
            source, _ = Source.objects.get_or_create(slug=s_info["slug"], defaults={"name": s_info["name"]})
            sources[s_info["slug"]] = source

        # 3. Campañas y Landings
        campanas_info = [
            {"name": "Edificio SkyView", "slug": "skyview", "color": "#3b82f6", "lat": -33.4372, "lng": -70.6506},
            {"name": "Barrio Universitario", "slug": "barrio-u", "color": "#10b981", "lat": -33.4489, "lng": -70.6607},
            {"name": "Lofts Industriales", "slug": "lofts", "color": "#f59e0b", "lat": -33.4429, "lng": -70.6300},
        ]

        landings = []
        for c in campanas_info:
            camp, _ = Campaign.objects.get_or_create(slug=c["slug"], defaults={"name": c["name"], "budget": random.randint(1000, 5000)})
            
            # Crear Propiedad asociada
            prop, _ = Property.objects.get_or_create(
                slug=c["slug"],
                defaults={
                    "name": c["name"],
                    "location": "Santiago, Chile",
                    "latitude": c["lat"],
                    "longitude": c["lng"],
                    "min_investment": random.randint(2000, 5000),
                    "estimated_return": "8% - 12%"
                }
            )
            camp.properties.add(prop)

            landing, _ = LandingPage.objects.get_or_create(
                slug=c["slug"],
                defaults={
                    "title": f"Invierte en {c['name']}",
                    "subtitle": "La mejor rentabilidad del sector.",
                    "primary_color": c["color"],
                    "campaign": camp,
                    "source": sources["facebook"],
                    "benefits": [
                        {"icon": "Building", "title": "Entrega Inmediata"},
                        {"icon": "TrendingUp", "title": "Plusvalía del 15%"},
                        {"icon": "Shield", "title": "Seguridad 24/7"}
                    ]
                }
            )
            landings.append(landing)

        # 4. Generación de Datos en el Tiempo (90 días atrás)
        ahora = timezone.now()
        total_leads = 0
        total_visitas = 0

        self.stdout.write("Generando registros diarios...")
        for i in range(90, -1, -1):
            fecha = ahora - timedelta(days=i)
            
            for lp in landings:
                # Simular visitas diarias (entre 10 y 50)
                num_visitas = random.randint(10, 50)
                for _ in range(num_visitas):
                    v = LandingPageVisit.objects.create(
                        landing_page=lp,
                        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Simulation",
                        ip_address=f"192.168.1.{random.randint(1, 254)}"
                    )
                    # Forzar fecha en el pasado
                    LandingPageVisit.objects.filter(id=v.id).update(created_at=fecha)
                    total_visitas += 1
                
                # Actualizar contador acumulado en la landing
                LandingPage.objects.filter(id=lp.id).update(visits_count=lp.visits_count + num_visitas)
                lp.refresh_from_db()

                # Simular conversión (Leads) - Tasa del ~10%
                num_leads = int(num_visitas * random.uniform(0.05, 0.15))
                for _ in range(num_leads):
                    vendedor = random.choice(vendedores)
                    lead = Lead.objects.create(
                        original_email=f"prospecto_{total_leads}@example.com",
                        first_name=f"Lead_{total_leads}",
                        last_name=f"Prueba_{i}",
                        phone=f"+569{random.randint(10000000, 99999999)}",
                        status=random.choice(Lead.Status.choices)[0],
                        assigned_to=vendedor,
                        first_source=lp.source,
                        campaign=lp.campaign,
                    )
                    # Forzar fecha
                    Lead.objects.filter(id=lead.id).update(created_at=fecha)
                    
                    # Añadir interacciones al azar
                    num_ints = random.randint(1, 3)
                    for k in range(num_ints):
                        int_date = fecha + timedelta(hours=random.randint(1, 48))
                        if int_date > ahora: int_date = ahora
                        
                        inte = Interaction.objects.create(
                            lead=lead,
                            type=random.choice(Interaction.Type.choices)[0],
                            notes=f"Seguimiento automático día {i}",
                        )
                        Interaction.objects.filter(id=inte.id).update(created_at=int_date)
                    
                    total_leads += 1

        self.stdout.write(self.style.SUCCESS(f"\n✅ Éxito: Se generaron {total_visitas} visitas y {total_leads} leads en los últimos 90 días."))
