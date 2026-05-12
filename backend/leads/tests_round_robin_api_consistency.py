from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from leads.models import RoundRobinState, VendorProfile

class RoundRobinAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser('admin', 'admin@test.com', 'pass')
        self.client.force_authenticate(user=self.admin)
        
        # Crear 3 vendedores: Ana (ID 10), Carlos (11), Maria (12)
        # Nota: Usamos nombres para facilitar lectura pero el RR usa IDs
        self.v1 = User.objects.create_user('ana', 'ana@test.com', 'pass')
        self.v2 = User.objects.create_user('carlos', 'carlos@test.com', 'pass')
        self.v3 = User.objects.create_user('maria', 'maria@test.com', 'pass')
        
        # Asegurar perfiles activos
        for v in [self.v1, self.v2, self.v3]:
            v.vendor_profile.is_available_for_leads = True
            v.vendor_profile.save()

    def test_next_in_line_jumps_when_paused(self):
        """
        Verificar que el indicador 'is_next_in_line' salta correctamente
        cuando el usuario que seguía es pausado.
        """
        # 1. Estado inicial: Nadie ha sido asignado. El siguiente debería ser el ID más bajo (Ana).
        response = self.client.get('/api/v1/analytics/performance/')
        data = response.json()
        ana_data = next(v for v in data if v['vendor_id'] == self.v1.id)
        self.assertTrue(ana_data['is_next_in_line'], "Ana debería ser la primera 'SIGUIENTE'")

        # 2. Pausamos a Ana mediante la API
        self.client.post('/api/v1/analytics/performance/', {'vendor_id': self.v1.id})
        
        # 3. Verificamos el nuevo estado
        response = self.client.get('/api/v1/analytics/performance/')
        data = response.json()
        
        ana_data = next(v for v in data if v['vendor_id'] == self.v1.id)
        carlos_data = next(v for v in data if v['vendor_id'] == self.v2.id)
        
        self.assertFalse(ana_data['is_available'])
        self.assertFalse(ana_data['is_next_in_line'], "Ana NO puede ser 'SIGUIENTE' si está pausada")
        self.assertTrue(carlos_data['is_next_in_line'], "El indicador debería haber saltado a Carlos")

        # 4. Pausamos también a Carlos
        self.client.post('/api/v1/analytics/performance/', {'vendor_id': self.v2.id})
        response = self.client.get('/api/v1/analytics/performance/')
        data = response.json()
        
        maria_data = next(v for v in data if v['vendor_id'] == self.v3.id)
        self.assertTrue(maria_data['is_next_in_line'], "El indicador debería haber saltado a Maria")
