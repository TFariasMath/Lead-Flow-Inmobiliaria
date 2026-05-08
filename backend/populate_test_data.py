import os
import django
import shutil
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import Property, Campaign, LandingPage, MediaAsset, Source
from django.core.files import File

# Paths to generated images (Update these with the actual paths from the previous tool calls)
IMAGE_BASE_PATH = Path(r'C:\Users\USER\.gemini\antigravity\brain\f6cdc343-2812-4d9a-b608-61d86923a3e4')
IMAGES = {
    'villa': IMAGE_BASE_PATH / 'villa_punta_cana_1778212897842.png',
    'apartment': IMAGE_BASE_PATH / 'modern_apartment_city_1778212916419.png',
    'eco': IMAGE_BASE_PATH / 'eco_lodge_jungle_1778212930484.png'
}

def populate():
    print("Starting data population...")

    # 1. Create Media Assets
    assets = {}
    for key, path in IMAGES.items():
        if not path.exists():
            print(f"Warning: Image {path} not found. Skipping.")
            continue
        
        with open(path, 'rb') as f:
            asset = MediaAsset.objects.create(
                title=f"Imagen {key.capitalize()}",
                alt_text=f"Una vista hermosa de {key}"
            )
            asset.file.save(path.name, File(f), save=True)
            assets[key] = asset
            print(f"Created MediaAsset for {key}")

    # 2. Create Properties
    properties = []
    
    # Villa Punta Cana
    p1 = Property.objects.create(
        name="Villa Serena Punta Cana",
        slug="villa-serena-punta-cana",
        description="Espectacular villa de lujo frente al mar con acabados premium y diseño contemporáneo.",
        location="Punta Cana, RD",
        min_investment=450000.00,
        estimated_return="10% - 14% Anual",
        delivery_date="Diciembre 2025",
        amenities=["Piscina Infinity", "Acceso Privado Playa", "Seguridad 24/7", "Domótica"],
        main_image=assets.get('villa')
    )
    properties.append(p1)
    
    # Modern Apartment
    p2 = Property.objects.create(
        name="Skyline Tower Santiago",
        slug="skyline-tower-santiago",
        description="Departamentos inteligentes en el corazón del distrito financiero. Ideal para rentas cortas.",
        location="Las Condes, Santiago",
        min_investment=120000.00,
        estimated_return="7% - 9% Anual",
        delivery_date="Marzo 2026",
        amenities=["Gimnasio Pro", "Coworking Space", "Rooftop Bar", "Estacionamiento Eléctrico"],
        main_image=assets.get('apartment')
    )
    properties.append(p2)
    
    # Eco Lodge
    p3 = Property.objects.create(
        name="Amazonia Eco-Resort",
        slug="amazonia-eco-resort",
        description="Inversión sostenible en el corazón de la selva. Un santuario de paz y rentabilidad ecológica.",
        location="Tulum, México",
        min_investment=85000.00,
        estimated_return="12% Anual",
        delivery_date="Octubre 2025",
        amenities=["Energía Solar", "Huerto Orgánico", "Cenote Privado", "Yoga Deck"],
        main_image=assets.get('eco')
    )
    properties.append(p3)
    
    print(f"Created {len(properties)} Properties.")

    # 3. Create Campaign
    c1 = Campaign.objects.create(
        name="Inversiones Caribe Pro 2024",
        slug="caribe-pro-2024",
        budget=15000.00,
        brochure_title="Oportunidades de Inversión en el Caribe",
        brochure_description="Descubre cómo hacer crecer tu patrimonio con las propiedades más exclusivas y rentables de la región. Te presentamos una selección curada por nuestros expertos.",
        brochure_features=["Alta Plusvalía Garantizada", "Gestión de Rentas Vacacionales", "Exención de Impuestos (CONFOTUR)"]
    )
    c1.properties.add(p1, p3) # Add Villa and Eco Lodge
    print(f"Created Campaign: {c1.name}")

    # 4. Create Source
    source, _ = Source.objects.get_or_create(
        slug="landing-caribe",
        defaults={"name": "Landing Caribe"}
    )

    # 5. Create Landing Page
    l1 = LandingPage.objects.create(
        title="Invierte en el Paraíso: Punta Cana & Tulum",
        slug="invertir-paraiso",
        subtitle="Rentas garantizadas y plusvalía en las zonas de mayor crecimiento turístico.",
        description="Déjanos tus datos para recibir el brochure exclusivo con proyecciones financieras y beneficios fiscales.",
        benefits=[
            {"icon": "TrendingUp", "title": "Retorno Asegurado", "text": "Hasta 12% de ROI anual."},
            {"icon": "ShieldCheck", "title": "Seguridad Jurídica", "text": "Proyectos con respaldo bancario."},
            {"icon": "Sun", "title": "Uso Vacacional", "text": "Disfruta tu propiedad cuando quieras."}
        ],
        primary_color="#0ea5e9",
        campaign=c1,
        source=source,
        image_asset=assets.get('villa')
    )
    print(f"Created Landing Page: {l1.title}")

    print("Data population complete!")

if __name__ == "__main__":
    populate()
