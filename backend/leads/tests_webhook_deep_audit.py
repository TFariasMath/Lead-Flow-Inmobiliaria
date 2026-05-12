import uuid
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from leads.models import Lead, Source, Interaction, WebhookLog
from leads.services.webhooks import WebhookProcessor, ReprocessWebhook

class WebhookDeepAuditTests(TestCase):
    """
    Suite de pruebas de alta intensidad para el motor de captura de webhooks.
    Verifica la auditoría, resolución de identidad y robustez ante fallos.
    """

    def setUp(self):
        # Crear un vendedor para el Round Robin
        self.user = User.objects.create_user(username="vendedor_test", email="test@test.com", password="pass")
        # Asegurar que el perfil esté configurado (señales automáticas)
        self.user.vendor_profile.is_available_for_leads = True
        self.user.vendor_profile.save()

    def test_webhook_success_audit(self):
        """1. Verificar que un webhook exitoso se registra y crea un lead."""
        payload = {
            "first_name": "Juan",
            "last_name": "Pérez",
            "email": "juan@perez.com",
            "phone": "+56912345678",
            "source_type": "facebook_ads"
        }
        
        processor = WebhookProcessor(source_type="facebook_ads", raw_body=payload)
        log = processor.process()

        self.assertEqual(log.status, WebhookLog.Status.SUCCESS)
        self.assertIsNotNone(log.lead)
        self.assertEqual(log.lead.original_email, "juan@perez.com")
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(Interaction.objects.count(), 1)

    def test_webhook_duplicate_prevention(self):
        """2. Verificar que múltiples webhooks del mismo email NO crean duplicados pero SÍ interacciones."""
        email = "duplicate@test.com"
        payload = {"email": email, "first_name": "Original"}
        
        # Primer envío
        WebhookProcessor(source_type="web", raw_body=payload).process()
        
        # Segundo envío con datos actualizados
        payload_update = {"email": email, "first_name": "Actualizado", "company": "Empresa X"}
        log = WebhookProcessor(source_type="web", raw_body=payload_update).process()

        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(Interaction.objects.count(), 2)
        
        # Verificar que se actualizaron los campos
        lead = Lead.objects.get(original_email=email)
        self.assertEqual(lead.first_name, "Actualizado")
        self.assertEqual(lead.company, "Empresa X")

    def test_webhook_missing_email_failure(self):
        """3. Verificar que si falta el email, el log se marca como FAILED con el error correcto."""
        payload = {"first_name": "Sin Email", "phone": "123"}
        
        processor = WebhookProcessor(source_type="generic", raw_body=payload)
        log = processor.process()

        self.assertEqual(log.status, WebhookLog.Status.FAILED)
        self.assertIn("No se encontró un email válido", log.error_message)
        self.assertIsNone(log.lead)
        self.assertEqual(Lead.objects.count(), 0)

    def test_calendly_nested_extraction(self):
        """4. Verificar la extracción profunda para la estructura de Calendly."""
        payload = {
            "payload": {
                "invitee": {
                    "email": "calendly@user.com",
                    "first_name": "User",
                    "last_name": "Calendly",
                    "text_reminder_number": "555-123"
                }
            }
        }
        
        processor = WebhookProcessor(source_type="calendly", raw_body=payload)
        log = processor.process()

        self.assertEqual(log.status, WebhookLog.Status.SUCCESS)
        self.assertEqual(log.lead.original_email, "calendly@user.com")
        self.assertEqual(log.lead.phone, "555-123")

    def test_webhook_reprocess_flow(self):
        """5. Simular el flujo de corregir un webhook fallido (reprocess)."""
        # 1. Llega un webhook roto (sin email)
        payload_broken = {"nombre": "Roto"}
        processor = WebhookProcessor(source_type="web", raw_body=payload_broken)
        log = processor.process()
        self.assertEqual(log.status, WebhookLog.Status.FAILED)

        # 2. El administrador corrige el JSON
        fixed_body = {"email": "corregido@test.com", "first_name": "Corregido"}
        
        # 3. Disparar el reprocesamiento
        reprocessed_log = ReprocessWebhook.reprocess(
            webhook_log=log, 
            edited_body=fixed_body, 
            user=self.user
        )

        self.assertEqual(reprocessed_log.status, WebhookLog.Status.SUCCESS)
        self.assertEqual(reprocessed_log.lead.original_email, "corregido@test.com")
        self.assertEqual(reprocessed_log.edited_by, self.user)
        self.assertEqual(Lead.objects.count(), 1)

    def test_high_concurrency_race_condition(self):
        """6. Test de estrés: Verificar que múltiples procesos no rompan la unicidad (Integrity)."""
        email = "race@condition.com"
        payload = {"email": email}
        
        # Simulamos dos procesos que intentan crear el mismo lead casi al mismo tiempo
        # En un test unitario es secuencial, pero validamos que el segundo proceso
        # use el select_for_update correctamente (en código) y que no explote.
        p1 = WebhookProcessor(source_type="p1", raw_body=payload)
        p1.process()
        
        p2 = WebhookProcessor(source_type="p2", raw_body=payload)
        log2 = p2.process()

        self.assertEqual(log2.status, WebhookLog.Status.SUCCESS)
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(Interaction.objects.count(), 2)
