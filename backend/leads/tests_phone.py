from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Lead, Source

class LeadPhoneFormattingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(username='admin', email='admin@test.com', password='password')
        self.client.force_authenticate(user=self.user)
        self.source = Source.objects.create(name="Manual", slug="manual")

    def test_create_lead_with_chilean_phone(self):
        """Verifica que un lead con código de Chile (+56) se guarde correctamente."""
        payload = {
            "original_email": "chile@test.com",
            "first_name": "Juan",
            "last_name": "Perez",
            "phone": "+56912345678",
            "first_source": self.source.id
        }
        response = self.client.post('/api/v1/leads/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        lead = Lead.objects.get(original_email="chile@test.com")
        self.assertEqual(lead.phone, "+56912345678")

    def test_create_lead_with_international_phone(self):
        """Verifica que un lead con código internacional (+54 Argentina) se guarde correctamente."""
        payload = {
            "original_email": "argentina@test.com",
            "first_name": "Lionel",
            "last_name": "Messi",
            "phone": "+5491112345678",
            "first_source": self.source.id
        }
        response = self.client.post('/api/v1/leads/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        lead = Lead.objects.get(original_email="argentina@test.com")
        self.assertEqual(lead.phone, "+5491112345678")

    def test_update_lead_phone(self):
        """Verifica que el teléfono de un lead se pueda actualizar correctamente."""
        lead = Lead.objects.create(
            original_email="update@test.com",
            first_name="Test",
            phone="+56900000000",
            first_source=self.source
        )
        
        # Actualizar a un nuevo número
        payload = {
            "phone": "+51999888777"
        }
        response = self.client.patch(f'/api/v1/leads/{lead.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        lead.refresh_from_db()
        self.assertEqual(lead.phone, "+51999888777")
