from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Lead, Source

class SourceRankingFixTests(APITestCase):
    """
    Valida que el ranking de fuentes calcule correctamente:
    1. El volumen total de leads.
    2. El porcentaje de participación de cada fuente (share) sobre el total.
    3. La tasa de conversión específica de cada fuente.
    """

    def setUp(self):
        self.admin = User.objects.create_superuser(username="admin_test", password="password123", email="admin@test.com")
        
        # Fuentes
        self.source_fb = Source.objects.create(name="Facebook Ads", slug="facebook-ads")
        self.source_web = Source.objects.create(name="Web Site", slug="web-site")
        
        # 1. Facebook Ads: 4 leads totales, 1 ganado (25% conversión, 80% share si hay 5 total)
        for _ in range(3):
            Lead.objects.create(
                original_email=f"fb_new_{_}@test.com", 
                first_name="FB", 
                first_source=self.source_fb,
                status=Lead.Status.NUEVO
            )
        Lead.objects.create(
            original_email="fb_won@test.com", 
            first_name="FB Won", 
            first_source=self.source_fb,
            status=Lead.Status.CIERRE_GANADO
        )

        # 2. Web Site: 1 lead total, 1 ganado (100% conversión, 20% share si hay 5 total)
        Lead.objects.create(
            original_email="web_won@test.com", 
            first_name="Web Won", 
            first_source=self.source_web,
            status=Lead.Status.CIERRE_GANADO
        )

    def test_source_ranking_metrics_accuracy(self):
        """Verifica que el ranking muestre Facebook Ads como líder por volumen (share)."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('dashboard-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        sources = data["leads_by_source"]
        
        # Deben haber 2 fuentes
        self.assertEqual(len(sources), 2)
        
        # El primero por volumen debe ser Facebook Ads (4 leads > 1 lead)
        fb_stats = next(s for s in sources if s["name"] == "Facebook Ads")
        web_stats = next(s for s in sources if s["name"] == "Web Site")
        
        # 1. Comprobar Acquisition Share (Participación sobre el total de 5 leads)
        # Facebook: 4/5 = 80.0%
        # Web: 1/5 = 20.0%
        self.assertEqual(fb_stats["acquisition_share"], 80.0)
        self.assertEqual(web_stats["acquisition_share"], 20.0)
        
        # 2. Comprobar Conversion Rate (Éxito dentro de la propia fuente)
        # Facebook: 1 ganado de 4 = 25.0%
        # Web: 1 ganado de 1 = 100.0%
        self.assertEqual(fb_stats["conversion_rate"], 25.0)
        self.assertEqual(web_stats["conversion_rate"], 100.0)
        
        # 3. Comprobar el orden (debe ser por volumen 'total')
        self.assertEqual(sources[0]["name"], "Facebook Ads")
        self.assertEqual(sources[1]["name"], "Web Site")

    def test_source_ranking_with_zero_leads(self):
        """Verifica que el sistema no falle si no hay leads."""
        Lead.objects.all().delete()
        self.client.force_authenticate(user=self.admin)
        url = reverse('dashboard-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["leads_by_source"], [])
