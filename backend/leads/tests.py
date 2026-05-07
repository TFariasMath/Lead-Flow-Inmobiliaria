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

    def test_webhook_sanitization_and_truncation(self):
        """
        Prueba que datos extremadamente largos se trunquen y que tipos
        incorrectos (como listas o dicts en campos de texto) se conviertan a string.
        """
        long_name = "A" * 300 # El límite es 150
        phone_array = ["8095551234", "8095555678"] # Llega como Array, debe ser String
        
        payload = {
            "source_type": "web",
            "data": {
                "email": "sanitized@test.com",
                "first_name": long_name,
                "phone": phone_array
            }
        }
        
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        lead = Lead.objects.get(original_email="sanitized@test.com")
        
        # 1. Truncado de nombre (300 -> 150)
        self.assertEqual(len(lead.first_name), 150)
        self.assertTrue(lead.first_name.startswith("AAAAA"))
        
        # 2. Conversión de Array a String JSON
        # El ORM no debe explotar y el dato debe guardarse como texto
        import json
        self.assertEqual(lead.phone, json.dumps(phone_array))
        
        # 3. El log debe ser exitoso
        self.assertEqual(WebhookLog.objects.get(lead=lead).status, WebhookLog.Status.SUCCESS)

    def test_lead_scoring(self):
        """Verifica que el puntaje se calcule correctamente al guardar."""
        # Solo email = 30
        lead1 = Lead.objects.create(original_email="score1@test.com")
        self.assertEqual(lead1.score, 30)

        # Email + Teléfono = 70
        lead2 = Lead.objects.create(original_email="score2@test.com", phone="123")
        self.assertEqual(lead2.score, 70)

        # Email + Teléfono + Nombre Completo = 90
        lead3 = Lead.objects.create(
            original_email="score3@test.com", 
            phone="123",
            first_name="John",
            last_name="Doe"
        )
        self.assertEqual(lead3.score, 90)

        # Email + Teléfono + Nombre Completo + Empresa = 100
        lead4 = Lead.objects.create(
            original_email="score4@test.com", 
            phone="123",
            first_name="John",
            last_name="Doe",
            company="Inc"
        )
        self.assertEqual(lead4.score, 100)

class AdvancedFeatureTests(APITestCase):
    def setUp(self):
        from django.contrib.auth.models import User
        from .models import VendorProfile, Source
        self.source = Source.objects.create(name="Web", slug="web")
        
        # Crear 3 vendedores
        self.vendor1 = User.objects.create_user(username="v1", password="pw", is_staff=False)
        self.vendor2 = User.objects.create_user(username="v2", password="pw", is_staff=False)
        self.vendor3 = User.objects.create_user(username="v3", password="pw", is_staff=False)
        
        # Desactivar disponibilidad del vendor2
        # Los profiles se crean automáticamente por la señal
        vp2 = self.vendor2.vendor_profile
        vp2.is_available_for_leads = False
        vp2.save()

    def test_round_robin_availability(self):
        from .services import LeadDistributionService
        from .models import Lead, RoundRobinState

        state = RoundRobinState.objects.create(id=1, last_assigned_user=None)
        
        # Asignar lead 1
        lead1 = Lead.objects.create(original_email="rr1@test.com")
        LeadDistributionService.assign(lead1)
        self.assertEqual(lead1.assigned_to, self.vendor1) # vendor 1

        # Asignar lead 2 -> debe saltar a vendor 2 porque is_available=False, y asignar a vendor 3
        lead2 = Lead.objects.create(original_email="rr2@test.com")
        LeadDistributionService.assign(lead2)
        self.assertEqual(lead2.assigned_to, self.vendor3)

        # Asignar lead 3 -> debe volver a vendor 1
        lead3 = Lead.objects.create(original_email="rr3@test.com")
        LeadDistributionService.assign(lead3)
        self.assertEqual(lead3.assigned_to, self.vendor1)

    def test_session_audit_on_login(self):
        from .models import SessionAudit
        
        login_url = reverse("token_obtain")
        response = self.client.post(login_url, {
            "username": "v1",
            "password": "pw"
        }, HTTP_USER_AGENT="Mozilla/5.0 Test", REMOTE_ADDR="192.168.1.100")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        audit = SessionAudit.objects.first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.user, self.vendor1)
        self.assertEqual(audit.ip_address, "192.168.1.100")
        self.assertEqual(audit.user_agent, "Mozilla/5.0 Test")

    def test_performance_analytics_view(self):
        from .models import Lead
        from django.contrib.auth.models import User
        
        admin_user = User.objects.create_superuser("admin", "admin@test.com", "pw")
        self.client.force_authenticate(user=admin_user)
        
        # Darle a vendor1 2 leads, 1 ganado
        Lead.objects.create(original_email="pa1@test.com", assigned_to=self.vendor1, status=Lead.Status.CIERRE_GANADO)
        Lead.objects.create(original_email="pa2@test.com", assigned_to=self.vendor1, status=Lead.Status.NUEVO)
        
        # Darle a vendor3 1 lead, perdido
        Lead.objects.create(original_email="pa3@test.com", assigned_to=self.vendor3, status=Lead.Status.CIERRE_PERDIDO)

        url = reverse("analytics-performance")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        
        # Deberíamos tener v1, v2 y v3 (admin excluido)
        self.assertEqual(len(data), 3)
        
        # Verificar v1 que debe estar primero porque tiene 50% de conversión (1/2)
        self.assertEqual(data[0]["vendor_name"], "v1")
        self.assertEqual(data[0]["total_assigned"], 2)
        self.assertEqual(data[0]["won"], 1)
        self.assertEqual(data[0]["conversion_rate"], 50.0)
        self.assertTrue(data[0]["is_available"])

        # Buscar v2 en la lista
        v2_data = next((v for v in data if v["vendor_name"] == "v2"), None)
        self.assertIsNotNone(v2_data)
        self.assertEqual(v2_data["total_assigned"], 0)
        self.assertFalse(v2_data["is_available"])

    def test_async_webhook_enqueues_task(self):
        import unittest.mock as mock
        url = reverse('webhook-receive')
        payload = {
            "source_type": "web",
            "data": {"email": "async@test.com"}
        }

        # Burlamos async_task de django_q
        with mock.patch('django_q.tasks.async_task') as mock_async:
            response = self.client.post(url, payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(mock_async.called)
            
            # Debe haber creado el log antes de encolar
            from .models import WebhookLog
            log = WebhookLog.objects.get(raw_body__email="async@test.com")
            
            # Verificamos los argumentos con los que se llamó a async_task
            mock_async.assert_called_once_with("leads.tasks.process_webhook_task", str(log.id))
