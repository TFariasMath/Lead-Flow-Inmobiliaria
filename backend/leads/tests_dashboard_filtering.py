from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from leads.models import Lead, Campaign, LandingPage, LandingPageVisit, Source

class DashboardFilteringTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(username='admin', email='admin@test.com', password='password')
        self.client.force_authenticate(user=self.admin_user)
        
        # 1. Setup Sources and Campaigns
        self.source = Source.objects.create(name="Web", slug="web")
        self.campaign_a = Campaign.objects.create(name="Campana A", slug="camp-a")
        self.campaign_b = Campaign.objects.create(name="Campana B", slug="camp-b")
        
        # 2. Setup Landing Pages
        self.landing_a = LandingPage.objects.create(
            title="Landing A", 
            slug="landing-a", 
            campaign=self.campaign_a,
            source=self.source
        )
        self.landing_b = LandingPage.objects.create(
            title="Landing B", 
            slug="landing-b", 
            campaign=self.campaign_b,
            source=self.source
        )
        
        # 3. Create Leads
        # 3 leads for Campaign A
        for i in range(3):
            Lead.objects.create(
                original_email=f"a{i}@test.com",
                campaign=self.campaign_a,
                first_source=self.source
            )
        # 1 lead for Campaign B
        Lead.objects.create(
            original_email="b1@test.com",
            campaign=self.campaign_b,
            first_source=self.source
        )
        
        # 4. Create Visits
        # 10 visits for Landing A
        for _ in range(10):
            LandingPageVisit.objects.create(landing_page=self.landing_a)
        # 5 visits for Landing B
        for _ in range(5):
            LandingPageVisit.objects.create(landing_page=self.landing_b)
            
        self.url = reverse('dashboard-stats')

    def test_global_stats(self):
        """Verifica que sin filtros se vean todos los datos."""
        response = self.client.get(f"{self.url}?days=30")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data['total_leads'], 4)
        self.assertEqual(data['total_landing_visits'], 15)

    def test_filtered_stats_campaign_a(self):
        """Verifica que el filtro por landing_id (Campana A) funcione."""
        response = self.client.get(f"{self.url}?landing_id={self.campaign_a.id}&days=30")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data['total_leads'], 3)
        self.assertEqual(data['total_landing_visits'], 10)
        
        # Verificar que el gráfico de visitas solo sume las de la Campana A
        total_chart_visits = sum(item['visits'] for item in data['visits_over_time'])
        self.assertEqual(total_chart_visits, 10)

    def test_filtered_stats_campaign_b(self):
        """Verifica que el filtro por landing_id (Campana B) funcione."""
        response = self.client.get(f"{self.url}?landing_id={self.campaign_b.id}&days=30")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data['total_leads'], 1)
        self.assertEqual(data['total_landing_visits'], 5)
        
        # Verificar que el gráfico de visitas solo sume las de la Campana B
        total_chart_visits = sum(item['visits'] for item in data['visits_over_time'])
        self.assertEqual(total_chart_visits, 5)

    def test_invalid_landing_id_falls_back_to_global(self):
        """Verifica que un ID inválido no rompa la API y devuelva global."""
        response = self.client.get(f"{self.url}?landing_id=99999&days=30")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Si el ID no existe en campañas, leads_qs.filter(campaign_id=99999) devolverá 0
        self.assertEqual(data['total_leads'], 0)
        self.assertEqual(data['total_landing_visits'], 0)
