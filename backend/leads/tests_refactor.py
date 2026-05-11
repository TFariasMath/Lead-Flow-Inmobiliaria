from django.test import TestCase
from .models import Lead, Source, WebhookLog
from .services.webhooks import WebhookProcessor

class RefactorValidationTest(TestCase):
    def setUp(self):
        self.source = Source.objects.create(name="Test", slug="test")
        # Creamos un lead inicial
        self.lead = Lead.objects.create(
            original_email="test@refactor.com",
            contact_email="test@refactor.com",
            first_name="Original",
            first_source=self.source
        )

    def test_identity_resolution_with_index(self):
        """
        Verifica que el procesador sigue encontrando al lead correctamente
        usando el nuevo campo indexado.
        """
        # Cambiamos el contact_email manualmente
        self.lead.contact_email = "new@refactor.com"
        self.lead.save()
        
        # Simulamos un webhook que viene con el correo NUEVO
        payload = {"email": "new@refactor.com", "first_name": "Updated"}
        processor = WebhookProcessor(source_type="test", raw_body=payload)
        log = processor.process()
        
        self.assertEqual(log.status, WebhookLog.Status.SUCCESS)
        self.assertEqual(log.lead.id, self.lead.id)
        self.assertEqual(log.lead.first_name, "Updated")
        
    def test_score_consistency(self):
        """Verifica que el cálculo de score automático no se rompió."""
        self.lead.phone = "123456"
        self.lead.save() # Dispara calculate_score
        self.lead.refresh_from_db()
        
        # Teléfono (40) + Email (30) + Nombre (10) = 80
        self.assertEqual(self.lead.score, 80)

    def test_no_redundant_history_on_same_data(self):
        """
        Verifica que el procesador NO crea una entrada en el historial
        si los datos del webhook son idénticos a los actuales.
        """
        initial_history_count = self.lead.history.count()
        
        # Mandamos exactamente los mismos datos que ya tiene el lead
        payload = {
            "first_name": "Original",
            "email": "test@refactor.com"
        }
        processor = WebhookProcessor(source_type="test", raw_body=payload)
        processor.process()
        
        # Verificamos que el historial NO creció
        new_history_count = self.lead.history.count()
        self.assertEqual(
            initial_history_count, 
            new_history_count, 
            "Se creó una entrada de historial innecesaria para datos idénticos."
        )
        print(f"[OK] Eficiencia: No se detectaron guardados redundantes.")
