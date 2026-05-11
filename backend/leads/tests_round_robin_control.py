from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import VendorProfile, Lead
from .services.distribution import LeadDistributionService

class RoundRobinControlTests(APITestCase):
    """
    Valida el flujo completo de control de disponibilidad:
    1. Alternar disponibilidad vía API (Toggle).
    2. Persistencia en la base de datos.
    3. Respeto de la regla en el servicio de asignación Round Robin.
    """

    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin_control", password="pw", email="a@c.com")
        
        # Crear 2 vendedores
        self.v1 = User.objects.create_user(username="v1", password="pw")
        self.v2 = User.objects.create_user(username="v2", password="pw")
        
        # Asegurar perfiles creados y disponibles inicialmente
        VendorProfile.objects.get_or_create(user=self.v1, is_available_for_leads=True)
        VendorProfile.objects.get_or_create(user=self.v2, is_available_for_leads=True)

    def test_toggle_availability_api(self):
        """Prueba que el endpoint de performance permita alternar la disponibilidad."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('analytics-performance')
        
        # 1. Sacar a v1 (True -> False)
        response = self.client.post(url, {"vendor_id": self.v1.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["is_available"])
        
        v1_profile = VendorProfile.objects.get(user=self.v1)
        self.assertFalse(v1_profile.is_available_for_leads)
        
        # 2. Re-integrar a v1 (False -> True)
        response = self.client.post(url, {"vendor_id": self.v1.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["is_available"])
        
        v1_profile.refresh_from_db()
        self.assertTrue(v1_profile.is_available_for_leads)

    def test_round_robin_respects_availability(self):
        """Prueba que el servicio de Round Robin salte a los vendedores no disponibles."""
        # Sacar a v1 del reparto
        profile_v1 = VendorProfile.objects.get(user=self.v1)
        profile_v1.is_available_for_leads = False
        profile_v1.save()
        
        # Crear un lead y pedir asignación
        lead = Lead.objects.create(original_email="rr_test@test.com", first_name="RR")
        
        # Intentar asignar. Solo v2 está disponible (is_available=True)
        assigned_user = LeadDistributionService.assign(lead).assigned_to
        
        # Debe ser v2, porque v1 está marcado como no disponible
        self.assertEqual(assigned_user.id, self.v2.id)
        
        # Si sacamos a v2 también, no debería asignar a nadie o manejar el fallo
        profile_v2 = VendorProfile.objects.get(user=self.v2)
        profile_v2.is_available_for_leads = False
        profile_v2.save()
        
        lead2 = Lead.objects.create(original_email="rr_test2@test.com")
        assigned_lead_none = LeadDistributionService.assign(lead2)
        self.assertIsNone(assigned_lead_none.assigned_to)

    def test_reintegration_flow(self):
        """Verifica que un vendedor re-integrado reciba leads en su turno correspondiente."""
        # 1. Estado inicial: V1 y V2 disponibles.
        # 2. Sacamos a V1.
        p1 = VendorProfile.objects.get(user=self.v1)
        p1.is_available_for_leads = False
        p1.save()
        
        # 3. Asignamos lead. Debe ir a V2.
        l1 = Lead.objects.create(original_email="l1@test.com")
        LeadDistributionService.assign(l1)
        self.assertEqual(l1.assigned_to.id, self.v2.id)
        
        # 4. Re-integramos a V1.
        p1.is_available_for_leads = True
        p1.save()
        
        # 5. Asignamos otro lead. 
        # Como el último fue V2, el carrusel debería volver a V1 ahora que está disponible.
        l2 = Lead.objects.create(original_email="l2@test.com")
        LeadDistributionService.assign(l2)
        
        self.assertEqual(l2.assigned_to.id, self.v1.id, "V1 debería haber recibido el lead tras ser re-integrado")

    def test_performance_view_reflects_availability(self):
        """Prueba que el GET de performance muestre el estado real."""
        profile_v1 = VendorProfile.objects.get(user=self.v1)
        profile_v1.is_available_for_leads = False
        profile_v1.save()
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('analytics-performance')
        response = self.client.get(url)
        
        v1_data = next(v for v in response.json() if v["vendor_id"] == self.v1.id)
        self.assertFalse(v1_data["is_available"])
