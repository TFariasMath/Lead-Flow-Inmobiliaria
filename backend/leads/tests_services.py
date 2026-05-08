from django.test import TestCase
from django.contrib.auth.models import User
from .models import Lead, Source, RoundRobinState, WebhookLog, VendorProfile, SystemAlert
from .services import LeadDistributionService, WebhookProcessor

class ServiceLayerTests(TestCase):
    def setUp(self):
        # Crear vendedores
        self.v1 = User.objects.create_user(username="v1", email="v1@test.com")
        self.v2 = User.objects.create_user(username="v2", email="v2@test.com")
        self.v3 = User.objects.create_user(username="v3", email="v3@test.com")
        
        # Por defecto todos están disponibles (via señal en models.py)
        
    def test_lead_distribution_round_robin_basic(self):
        """Verifica que los leads se repartan equitativamente 1, 2, 3, 1..."""
        l1 = Lead.objects.create(original_email="l1@test.com")
        l2 = Lead.objects.create(original_email="l2@test.com")
        l3 = Lead.objects.create(original_email="l3@test.com")
        l4 = Lead.objects.create(original_email="l4@test.com")

        # Primer lead -> Vendedor 1
        LeadDistributionService.assign(l1)
        self.assertEqual(l1.assigned_to, self.v1)

        # Segundo lead -> Vendedor 2
        LeadDistributionService.assign(l2)
        self.assertEqual(l2.assigned_to, self.v2)

        # Tercer lead -> Vendedor 3
        LeadDistributionService.assign(l3)
        self.assertEqual(l3.assigned_to, self.v3)

        # Cuarto lead -> Vendedor 1 (vuelve a empezar)
        LeadDistributionService.assign(l4)
        self.assertEqual(l4.assigned_to, self.v1)

    def test_lead_distribution_skips_unavailable(self):
        """Verifica que el carrusel salte a los vendedores no disponibles."""
        # Vendedor 2 se va de vacaciones
        self.v2.vendor_profile.is_available_for_leads = False
        self.v2.vendor_profile.save()

        l1 = Lead.objects.create(original_email="l1@test.com")
        l2 = Lead.objects.create(original_email="l2@test.com")

        # Lead 1 -> V1
        LeadDistributionService.assign(l1)
        self.assertEqual(l1.assigned_to, self.v1)

        # Lead 2 -> Debe ir al V3, saltando al V2
        LeadDistributionService.assign(l2)
        self.assertEqual(l2.assigned_to, self.v3)

    def test_webhook_processor_field_mapping_spanish(self):
        """Verifica que el procesador entienda campos en español (nombre, telefono)."""
        payload = {
            "nombre": "Juan",
            "apellido": "Perez",
            "email": "juan@test.com",
            "telefono": "555666",
            "empresa": "Constructora X"
        }
        processor = WebhookProcessor(source_type="web", raw_body=payload)
        processor.process()
        
        lead = Lead.objects.get(original_email="juan@test.com")
        self.assertEqual(lead.first_name, "Juan")
        self.assertEqual(lead.last_name, "Perez")
        self.assertEqual(lead.phone, "555666")
        self.assertEqual(lead.company, "Constructora X")

    def test_webhook_processor_normalization(self):
        """Verifica que el email se guarde siempre en minúsculas y sin espacios."""
        payload = {"Email": "  UPPER@case.COM  "}
        processor = WebhookProcessor(source_type="web", raw_body=payload)
        processor.process()
        
        self.assertTrue(Lead.objects.filter(original_email="upper@case.com").exists())

    def test_lead_distribution_no_vendors_creates_alert(self):
        """Verifica que se cree una Alerta del Sistema si no hay vendedores disponibles."""
        # Desactivamos a todos los vendedores
        User.objects.all().update(is_active=False)
        
        lead = Lead.objects.create(original_email="urgent@test.com")
        LeadDistributionService.assign(lead)
        
        # El lead queda sin asignar
        self.assertIsNone(lead.assigned_to)
        
        # Se creó una alerta crítica
        alert = SystemAlert.objects.filter(level=SystemAlert.Level.CRITICAL).first()
        self.assertIsNotNone(alert)
        self.assertIn("Fallo de Asignación", alert.title)
        self.assertIn("urgent@test.com", alert.description)
