from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import WebhookLog

class WebhookFilterTests(APITestCase):
    """
    Prueba que los filtros de la consola técnica funcionen:
    1. Filtrado por estado 'failed'.
    2. Filtrado por estado 'success'.
    """

    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin_test", password="pw", email="at@test.com")
        
        # Crear logs: 1 success, 1 failed
        WebhookLog.objects.create(
            source_type="test",
            raw_body={"email": "s@test.com"},
            status=WebhookLog.Status.SUCCESS
        )
        WebhookLog.objects.create(
            source_type="test",
            raw_body={"email": "f@test.com"},
            status=WebhookLog.Status.FAILED,
            error_message="Test Error"
        )

    def test_filter_failed_logs(self):
        """Verifica que el filtro ?status=failed devuelva solo los fallidos."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('webhooklog-list')
        
        response = self.client.get(url, {'status': 'failed'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Debe haber exactamente 1 en los resultados
        data = response.json()
        results = data.get('results', data) # Depende de si hay paginación
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'failed')

    def test_filter_success_logs(self):
        """Verifica que el filtro ?status=success devuelva solo los exitosos."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('webhooklog-list')
        
        response = self.client.get(url, {'status': 'success'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        results = data.get('results', data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'success')
