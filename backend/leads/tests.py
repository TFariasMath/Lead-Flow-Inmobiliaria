from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Lead, WebhookLog, Source, Interaction

class WebhookTests(APITestCase):
    def setUp(self):
        # Crear una fuente por defecto
        self.source = Source.objects.create(name="Web", slug="web")
        self.url = reverse('webhook-receive')

    def test_webhook_receive_success(self):
        """
        Prueba un webhook con formato perfecto.
        Debe crear un Lead, una Interacción y un Log exitoso.
        """
        payload = {
            "source_type": "web",
            "data": {
                "email": "test@example.com",
                "first_name": "Juan",
                "phone": "123456"
            }
        }
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(Interaction.objects.count(), 1)
        self.assertEqual(WebhookLog.objects.first().status, WebhookLog.Status.SUCCESS)
        
        lead = Lead.objects.first()
        self.assertEqual(lead.original_email, "test@example.com")
        self.assertEqual(lead.first_name, "Juan")

    def test_webhook_receive_malformed_structure(self):
        """
        SOLUCIÓN A: Prueba un JSON que no tiene la estructura 'source_type' ni 'data'.
        Antes daba error 400. Ahora debe dar 200 y guardar el log como FAILED.
        """
        payload = {
            "usuario_nombre": "Carlos",
            "contacto_mail": "carlos@mail.com"
        }
        response = self.client.post(self.url, payload, format='json')
        
        # Debe ser 200 porque aceptamos todo para no perder datos
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # No se crea Lead porque no encontramos el campo 'email' exacto todavía
        self.assertEqual(Lead.objects.count(), 0)
        
        # PERO, el log debe existir para que podamos corregirlo
        log = WebhookLog.objects.first()
        self.assertIsNotNone(log)
        self.assertEqual(log.status, WebhookLog.Status.FAILED)
        self.assertIn("El campo 'email' es requerido", log.error_message)

    def test_webhook_receive_missing_email(self):
        """
        Prueba estructura correcta pero sin email dentro de 'data'.
        """
        payload = {
            "source_type": "web",
            "data": {
                "first_name": "Sin Email"
            }
        }
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(WebhookLog.objects.first().status, WebhookLog.Status.FAILED)
        self.assertEqual(Lead.objects.count(), 0)

    def test_lead_data_merge(self):
        """
        Verifica que si llega nueva info de un lead existente, se completen los vacíos.
        """
        # 1. Primer contacto: solo email y nombre
        self.client.post(self.url, {
            "source_type": "web",
            "data": {"email": "merge@test.com", "first_name": "Original"}
        }, format='json')
        
        # 2. Segundo contacto: mismo email, pero trae teléfono
        self.client.post(self.url, {
            "source_type": "web",
            "data": {"email": "merge@test.com", "phone": "999999"}
        }, format='json')
        
        lead = Lead.objects.get(original_email="merge@test.com")
        self.assertEqual(Lead.objects.count(), 1) # No se duplicó
        self.assertEqual(lead.first_name, "Original") # Mantuvo el nombre
        self.assertEqual(lead.phone, "999999") # Agregó el teléfono
        self.assertEqual(Interaction.objects.count(), 2) # Tiene 2 interacciones
