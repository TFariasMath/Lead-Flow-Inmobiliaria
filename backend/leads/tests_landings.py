from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Lead, Source, LandingPage, LandingPageVisit, Campaign

class LandingPageTests(APITestCase):
    def setUp(self):
        self.source = Source.objects.create(name="Landing Page", slug="landing-page")
        self.campaign = Campaign.objects.create(name="Black Friday", slug="black-friday")
        self.landing = LandingPage.objects.create(
            title="Promo Departamentos",
            slug="departamentos-centro",
            source=self.source,
            campaign=self.campaign,
            is_active=True
        )

    def test_landing_page_detail_and_visit_tracking(self):
        """Verifica que entrar a una landing registre la visita."""
        url = reverse('landing-detail', kwargs={'slug': 'departamentos-centro'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # La landing debe haber incrementado su contador
        self.landing.refresh_from_db()
        self.assertEqual(self.landing.visits_count, 1)
        # Debe existir un registro de auditoría de visita
        self.assertEqual(LandingPageVisit.objects.count(), 1)
        self.assertEqual(LandingPageVisit.objects.first().landing_page, self.landing)

    def test_landing_page_submit_creates_lead(self):
        """Verifica que el envío del formulario cree un lead asociado a la campaña."""
        url = reverse('landing-submit', kwargs={'slug': 'departamentos-centro'})
        payload = {
            "email": "interesado@test.com",
            "first_name": "Maria",
            "phone": "998877",
            "utm_source": "google",
            "utm_medium": "cpc",
            "utm_campaign": "search_v1"
        }
        response = self.client.post(url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar creación del lead
        lead = Lead.objects.get(original_email="interesado@test.com")
        self.assertEqual(lead.first_name, "Maria")
        self.assertEqual(lead.campaign, self.campaign)
        self.assertEqual(lead.utm_source, "google")
        self.assertEqual(lead.utm_medium, "cpc")
        self.assertEqual(lead.utm_campaign, "search_v1")

    def test_landing_page_inactive_returns_404(self):
        """Verifica que una landing desactivada no sea accesible."""
        self.landing.is_active = False
        self.landing.save()
        
        url = reverse('landing-detail', kwargs={'slug': 'departamentos-centro'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
