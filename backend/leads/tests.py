"""
Lead Flow - Automated Tests
===========================
Suite de pruebas para garantizar la estabilidad del CRM.
Cubre: Ingesta de Webhooks, Lógica de Distribución (Round Robin), 
Scoring de Leads y Auditoría de Seguridad.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Lead, WebhookLog, Source, Interaction

class WebhookTests(APITestCase):
    """Pruebas sobre el endpoint de recepción de datos externos."""
    
    def setUp(self):
        # Configuración inicial: Fuente de prueba
        self.source = Source.objects.create(name="Web", slug="web")
        self.url = reverse('webhook-receive')

    def test_webhook_receive_success(self):
        """
        Escenario Ideal: Recibimos un JSON perfecto.
        Debe persistir el lead y registrar la actividad en el timeline.
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
        # El log debe marcarse como exitoso
        self.assertEqual(WebhookLog.objects.first().status, WebhookLog.Status.SUCCESS)

    def test_webhook_receive_malformed_structure(self):
        """
        Escenario de Error: Estructura de campos desconocida.
        El sistema NO debe fallar con 500, sino aceptar el dato (200) y marcarlo como FAILED
        para que un humano lo corrija manualmente después.
        """
        payload = {
            "usuario_nombre": "Carlos",
            "contacto_mail": "carlos@mail.com"
        }
        response = self.client.post(self.url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # No se crea Lead automáticamente porque no mapeamos los campos raros todavía
        self.assertEqual(Lead.objects.count(), 0)
        
        # El log debe capturar el error técnico
        log = WebhookLog.objects.first()
        self.assertEqual(log.status, WebhookLog.Status.FAILED)
        self.assertIn("El campo 'email' es requerido", log.error_message)

    def test_lead_data_merge(self):
        """
        Prueba la 'Inteligencia de Datos':
        Si un cliente vuelve a escribir, no duplicamos, sino que completamos su perfil.
        """
        # 1. Registro inicial (solo nombre)
        self.client.post(self.url, {
            "source_type": "web",
            "data": {"email": "merge@test.com", "first_name": "Original"}
        }, format='json')
        
        # 2. Registro posterior (agrega teléfono)
        self.client.post(self.url, {
            "source_type": "web",
            "data": {"email": "merge@test.com", "phone": "999999"}
        }, format='json')
        
        lead = Lead.objects.get(original_email="merge@test.com")
        self.assertEqual(Lead.objects.count(), 1) # Un solo registro
        self.assertEqual(lead.first_name, "Original") # No sobreescribió lo que ya había
        self.assertEqual(lead.phone, "999999") # Llenó el hueco vacío
        self.assertEqual(Interaction.objects.count(), 2) # Ambas visitas están en el timeline

    def test_webhook_sanitization_and_truncation(self):
        """
        Seguridad de Datos:
        Evita que strings gigantes rompan la base de datos truncándolos automáticamente.
        """
        long_name = "A" * 300 # Supera el límite de 150 del modelo
        
        payload = {
            "source_type": "web",
            "data": {
                "email": "sanitized@test.com",
                "first_name": long_name
            }
        }
        
        self.client.post(self.url, payload, format='json')
        lead = Lead.objects.get(original_email="sanitized@test.com")
        
        # Verificamos que se truncó a 150 caracteres sin dar error
        self.assertEqual(len(lead.first_name), 150)

    def test_lead_scoring(self):
        """Prueba el algoritmo de calificación de calidad del lead."""
        # Solo email: Calidad Bronce (30)
        lead1 = Lead.objects.create(original_email="score1@test.com")
        self.assertEqual(lead1.score, 30)

        # Email + Teléfono + Nombre: Calidad Oro (90)
        lead3 = Lead.objects.create(
            original_email="score3@test.com", 
            phone="123",
            first_name="John",
            last_name="Doe"
        )
        self.assertEqual(lead3.score, 90)


class AdvancedFeatureTests(APITestCase):
    """Pruebas sobre funciones críticas del negocio."""
    
    def setUp(self):
        from django.contrib.auth.models import User
        # Creamos vendedores de prueba
        self.vendor1 = User.objects.create_user(username="v1", password="pw")
        self.vendor2 = User.objects.create_user(username="v2", password="pw")
        
        # Marcamos al vendedor 2 como 'No Disponible'
        vp2 = self.vendor2.vendor_profile
        vp2.is_available_for_leads = False
        vp2.save()

    def test_round_robin_availability(self):
        """Verifica que el carrusel salte a los vendedores no disponibles."""
        from .services import LeadDistributionService
        from .models import RoundRobinState

        RoundRobinState.objects.create(id=1, last_assigned_user=None)
        
        # Lead 1 -> Debe ir al vendedor 1
        l1 = Lead.objects.create(original_email="rr1@test.com")
        LeadDistributionService.assign(l1)
        self.assertEqual(l1.assigned_to, self.vendor1)

        # Lead 2 -> Debe ir al vendedor 1 de nuevo, porque el 2 está en 'No Molestar'
        l2 = Lead.objects.create(original_email="rr2@test.com")
        LeadDistributionService.assign(l2)
        self.assertEqual(l2.assigned_to, self.vendor1)

    def test_performance_analytics_view(self):
        """Verifica el cálculo de tasas de conversión por vendedor."""
        admin_user = User.objects.create_superuser("admin", "admin@test.com", "pw")
        self.client.force_authenticate(user=admin_user)
        
        # Vendor 1: 1 lead ganado, 1 nuevo = 50% conversión
        Lead.objects.create(original_email="pa1@test.com", assigned_to=self.vendor1, status=Lead.Status.CIERRE_GANADO)
        Lead.objects.create(original_email="pa2@test.com", assigned_to=self.vendor1, status=Lead.Status.NUEVO)
        
        response = self.client.get(reverse("analytics-performance"))
        data = response.json()
        
        v1_stats = next((v for v in data if v["vendor_name"] == "v1"), None)
        self.assertEqual(v1_stats["conversion_rate"], 50.0)

    def test_async_webhook_enqueues_task(self):
        """Verifica que el endpoint asíncrono realmente mande la tarea a la cola de Django Q."""
        import unittest.mock as mock
        payload = {"source_type": "web", "data": {"email": "async@test.com"}}

        with mock.patch('django_q.tasks.async_task') as mock_async:
            self.client.post(self.url, payload, format='json')
            # Verificamos que se llamó a la función de encolamiento
            self.assertTrue(mock_async.called)
            # Verificamos que se pasó el ID del log correcto
            log = WebhookLog.objects.get(raw_body__email="async@test.com")
            mock_async.assert_called_once_with("leads.tasks.process_webhook_task", str(log.id))
