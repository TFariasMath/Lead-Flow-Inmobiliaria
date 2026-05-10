from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Lead, LandingPage, Campaign, Source

class IdentityResolutionTest(APITestCase):
    def setUp(self):
        self.source = Source.objects.create(name="Landing", slug="landing")
        self.landing = LandingPage.objects.create(
            title="Test", slug="test", is_active=True, source=self.source
        )
        self.url = reverse('landing-submit', kwargs={'slug': self.landing.slug})

    def test_double_anchor_resolution_success(self):
        """
        ESCENARIO: 
        1. Alguien se registra con error (far1as).
        2. El vendedor lo corrige en el CRM (farias).
        3. El usuario vuelve a entrar con el correo correcto (farias).
        EL SISTEMA DEBE RECONOCERLO Y ACTUALIZAR LA FICHA EXISTENTE.
        """
        # 1. Registro inicial con error
        payload_error = {
            "first_name": "Tomas",
            "email": "tomas.far1as@hotmail.com",
            "phone": "555-001"
        }
        self.client.post(self.url, payload_error, format='json')
        
        # Simulamos la corrección manual del vendedor en el CRM
        lead = Lead.objects.get(original_email="tomas.far1as@hotmail.com")
        lead.contact_email = "tomas.farias@hotmail.com" # El correo correcto
        lead.save()
        
        # 2. Registro nuevo con el correo ya corregido
        payload_correct = {
            "first_name": "Tomas Farias", # Nombre más completo
            "email": "tomas.farias@hotmail.com",
            "phone": "555-999", # Teléfono nuevo
            "investment_goal": "plusvalia"
        }
        response = self.client.post(self.url, payload_correct, format='json')
        
        # Verificamos éxito en la respuesta
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # VERIFICACIÓN CRÍTICA: ¿Hay 1 o 2 leads? Debe haber solo 1.
        total_leads = Lead.objects.count()
        self.assertEqual(total_leads, 1, "Se creó un duplicado cuando debería haberse unido al existente.")
        
        # Verificamos que los datos se actualizaron en la ficha original
        lead.refresh_from_db()
        self.assertEqual(lead.first_name, "Tomas Farias")
        self.assertEqual(lead.phone, "555-999")
        self.assertEqual(lead.investment_goal, "plusvalia")
        self.assertEqual(lead.contact_email, "tomas.farias@hotmail.com")
        self.assertEqual(lead.original_email, "tomas.far1as@hotmail.com") # El ancla original se mantiene

        print("\n[OK] Resolución de Doble Ancla: Tomás reconocido exitosamente tras corrección manual.")

    def test_new_lead_creation_no_match(self):
        """Verifica que si no hay coincidencia por ningún lado, se cree uno nuevo."""
        payload = {"email": "nuevo@test.com", "first_name": "Nuevo"}
        self.client.post(self.url, payload, format='json')
        self.assertEqual(Lead.objects.count(), 1)
        
        payload2 = {"email": "otro@test.com", "first_name": "Otro"}
        self.client.post(self.url, payload2, format='json')
        self.assertEqual(Lead.objects.count(), 2)

    def test_multiple_submissions_same_original_email(self):
        """Verifica que múltiples envíos al mismo mail original sigan funcionando."""
        payload = {"email": "repetido@test.com", "first_name": "V1"}
        self.client.post(self.url, payload, format='json')
        
        payload2 = {"email": "repetido@test.com", "first_name": "V2"}
        self.client.post(self.url, payload2, format='json')
        
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(Lead.objects.first().first_name, "V2")

        print("[OK] Tests de Identidad completados satisfactoriamente.")
