from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Lead, LandingPage, Campaign, Source

class LeadSubmissionEdgeCasesTest(APITestCase):
    def setUp(self):
        self.source = Source.objects.create(name="Web Direct", slug="web-direct")
        self.campaign = Campaign.objects.create(name="Campaña Global", slug="global")
        self.landing = LandingPage.objects.create(
            title="Landing Test",
            slug="test-page",
            campaign=self.campaign,
            source=self.source,
            is_active=True
        )
        self.url = reverse('landing-submit', kwargs={'slug': self.landing.slug})

    def test_missing_required_email_returns_error(self):
        """No debe permitir crear un lead sin email."""
        payload = {
            "first_name": "Incompleto",
            "last_name": "Sin Email"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_duplicate_email_updates_existing_lead(self):
        """Si el email ya existe, se deben actualizar los datos en lugar de duplicar el registro."""
        # Primer envío
        payload1 = {
            "first_name": "Original",
            "email": "repetido@ejemplo.com",
            "phone": "11111111"
        }
        self.client.post(self.url, payload1, format='json')
        
        # Segundo envío con datos actualizados
        payload2 = {
            "first_name": "Actualizado",
            "email": "repetido@ejemplo.com",
            "phone": "22222222",
            "investment_goal": "renta"
        }
        response = self.client.post(self.url, payload2, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que solo hay UN lead
        leads = Lead.objects.filter(original_email="repetido@ejemplo.com")
        self.assertEqual(leads.count(), 1)
        
        # Ahora el nombre SÍ cambia (se sobreescribe con lo más nuevo)
        self.assertEqual(leads.first().first_name, "Actualizado")
        
        # El perfil de inversión también se actualiza
        self.assertEqual(leads.first().investment_goal, "renta")

    def test_invalid_email_format_rejected(self):
        """Emails mal formados deben ser rechazados por el serializador."""
        payload = {
            "email": "esto-no-es-un-email",
            "first_name": "Error"
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_landing_rejects_submission(self):
        """Si la landing está desactivada, no debe aceptar leads."""
        self.landing.is_active = False
        self.landing.save()
        
        payload = {"email": "test@desactivada.com", "first_name": "Test"}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        print("\n[OK] Tests de Casos Borde completados: El sistema maneja errores y duplicados de forma robusta.")
