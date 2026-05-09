import os
import random
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import Property, Campaign, MediaAsset

sector_names = ['Lastarria Premium', 'Centro Histórico', 'Barrio Cívico']
campaigns = [Campaign.objects.get_or_create(name=name, defaults={'slug': name.lower().replace(' ', '-')})[0] for name in sector_names]
placeholder = MediaAsset.objects.filter(file='assets/property_placeholder.jpg').first()

# Existing base coordinates in Santiago
base_coords = [(-33.4429, -70.6300), (-33.4372, -70.6506), (-33.4489, -70.6607)]

for i in range(15):
    lat_base, lng_base = random.choice(base_coords)
    # Add small variations to create a cluster
    lat = lat_base + random.uniform(-0.008, 0.008)
    lng = lng_base + random.uniform(-0.008, 0.008)
    
    p = Property.objects.create(
        name=f'Activo Estratégico {i+20}',
        slug=f'activo-est-{i+20}',
        location='Santiago, Chile',
        address=f'Calle Principal {200+i}',
        latitude=lat,
        longitude=lng,
        min_investment=random.randint(2500, 6000),
        estimated_return=f'{random.randint(9, 16)}%',
        main_image=placeholder,
        is_active=True
    )
    
    camp = random.choice(campaigns)
    camp.properties.add(p)
    print(f'Creado: {p.name} en Sector: {camp.name}')

print("Sembrado de clusters completado.")
