import os
import sys
import django

# Añadir el directorio backend al path para que encuentre 'config' y 'leads'
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import LandingPage, Campaign, Source

def setup_e2e_data():
    source, _ = Source.objects.get_or_create(slug='e2e-test', defaults={'name': 'E2E Test'})
    campaign, _ = Campaign.objects.get_or_create(slug='e2e-campaign', defaults={'name': 'E2E Campaign'})
    
    landing, created = LandingPage.objects.update_or_create(
        slug='test-e2e-landing',
        defaults={
            'title': 'Landing de Prueba E2E',
            'subtitle': 'Subtítulo para pruebas automáticas',
            'description': 'Descripción de prueba.',
            'cta_text': 'Enviar Datos',
            'success_message': '¡Gracias por participar en el test!',
            'campaign': campaign,
            'source': source,
            'is_active': True
        }
    )
    print(f"Data E2E preparada. Landing creada: {created}")

if __name__ == "__main__":
    setup_e2e_data()
