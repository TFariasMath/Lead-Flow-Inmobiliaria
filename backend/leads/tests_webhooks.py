from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import WebhookLog, Lead, Source, LandingPage

class WebhookReprocessTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@test.com', 'pass123')
        self.client.force_authenticate(user=self.admin)
        
        self.source = Source.objects.create(name="Landing", slug="landing")
        self.landing = LandingPage.objects.create(
            title="Test", slug="test", is_active=True, source=self.source
        )

    def test_modo_quirofano_surgery_success(self):
        """
        ESCENARIO: Un lead llega con un error en el campo email (typo en la llave).
        Hacemos la 'cirugía' en el log y re-procesamos.
        """
        # 1. Crear un log fallido manualmente (simulando un error previo)
        raw_bad_data = {"first_name": "Paciente", "emial": "error@test.com"} # Error: 'emial'
        log = WebhookLog.objects.create(
            source_type="web-v1",
            raw_body=raw_bad_data,
            status=WebhookLog.Status.FAILED,
            error_message="Email es obligatorio"
        )
        
        # 2. Ejecutar la 'Cirugía' vía API
        url = reverse('webhooklog-reprocess', kwargs={'pk': log.id})
        corrected_data = {"first_name": "Paciente Curado", "email": "curado@test.com"}
        response = self.client.post(url, {"edited_body": corrected_data}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Verificaciones
        log.refresh_from_db()
        self.assertEqual(log.status, WebhookLog.Status.SUCCESS)
        self.assertIsNotNone(log.lead, "El log exitoso debe estar vinculado al Lead creado.")
        
        # Verificar que el Lead tiene los datos CORREGIDOS
        lead = log.lead
        self.assertEqual(lead.first_name, "Paciente Curado")
        self.assertEqual(lead.original_email, "curado@test.com")
        
        print("\n[OK] Modo Quirófano: Cirugía de JSON realizada y lead recuperado exitosamente.")

    def test_bulk_reprocess_success(self):
        """
        ESCENARIO: Tenemos 3 leads que fallaron por un problema temporal.
        Los re-procesamos todos de golpe.
        """
        # Crear 3 logs fallidos
        log_ids = []
        for i in range(3):
            l = WebhookLog.objects.create(
                source_type="web-v1",
                raw_body={"first_name": f"Lead {i}", "email": f"bulk{i}@test.com"},
                status=WebhookLog.Status.FAILED
            )
            log_ids.append(l.id)
            
        # Ejecutar procesamiento masivo
        url = reverse('webhooklog-bulk-reprocess')
        response = self.client.post(url, {"log_ids": log_ids}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["success"], 3)
        
        # Verificar que los 3 leads existen ahora
        self.assertEqual(Lead.objects.filter(original_email__startswith="bulk").count(), 3)
        
        print("[OK] Procesamiento Masivo: 3 leads recuperados en una sola operación.")

    def test_traceability_link(self):
        """Verifica que el enlace directo entre Log y Lead funcione."""
        log = WebhookLog.objects.create(
            source_type="web-v1",
            raw_body={"first_name": "Trace", "email": "trace@test.com"},
            status=WebhookLog.Status.FAILED
        )
        
        # Procesar
        url = reverse('webhooklog-reprocess', kwargs={'pk': log.id})
        self.client.post(url, {}, format='json')
        
        log.refresh_from_db()
        self.assertIsNotNone(log.lead)
        self.assertEqual(log.lead.original_email, "trace@test.com")
        
        print("[OK] Enlace Directo: Trazabilidad completa entre el log técnico y la ficha del lead.")
