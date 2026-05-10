from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Lead, LandingPage, Campaign, Source

class PremiumFormSubmissionTest(APITestCase):
    def setUp(self):
        # Setup basic data
        self.source = Source.objects.create(name="Landing Test", slug="landing-test")
        self.campaign = Campaign.objects.create(name="Campaña Inversión Premium", slug="inv-premium")
        self.landing = LandingPage.objects.create(
            title="Landing de Inversión Élite",
            slug="elite-investment",
            campaign=self.campaign,
            source=self.source,
            is_active=True
        )

    def test_premium_form_submission_creates_qualified_lead(self):
        """
        Verifica que al enviar el formulario multi-paso (simulado como un POST),
        se crea un lead con los campos de inversión (objetivo y capacidad) correctamente.
        """
        url = reverse('landing-submit', kwargs={'slug': self.landing.slug})
        
        payload = {
            "first_name": "Juan",
            "last_name": "Inversor",
            "email": "juan.vip@ejemplo.com",
            "phone": "56912345678",
            "investment_goal": "plusvalia",
            "investment_capacity": "USD 600k - 1M",
            "utm_source": "google",
            "utm_medium": "cpc"
        }

        response = self.client.post(url, payload, format='json')

        # 1. Verificar respuesta exitosa
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])

        # 2. Verificar persistencia en base de datos
        lead = Lead.objects.get(original_email="juan.vip@ejemplo.com")
        self.assertEqual(lead.first_name, "Juan")
        self.assertEqual(lead.last_name, "Inversor")
        self.assertEqual(lead.phone, "56912345678")
        
        # 3. Verificar campos de inversión premium
        self.assertEqual(lead.investment_goal, "plusvalia")
        self.assertEqual(lead.investment_capacity, "USD 600k - 1M")
        
        # 4. Verificar atribución y campaña
        self.assertEqual(lead.campaign, self.campaign)
        self.assertEqual(lead.utm_source, "google")

        # 5. Verificar que el score se calculó considerando los nuevos campos
        # Teléfono(40) + Email(30) + Nombre(20) + Goal(5) + Capacity(5) = 100
        self.assertEqual(lead.score, 100)

        print(f"\n[OK] Test Exitoso: Lead '{lead.full_name}' creado con score {lead.score} y perfil de inversion '{lead.investment_goal}'.")
