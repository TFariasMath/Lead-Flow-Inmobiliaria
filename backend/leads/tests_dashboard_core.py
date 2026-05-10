from django.contrib.auth.models import User, Group
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Lead, Source, WebhookLog, Campaign, Property, MediaAsset

class DashboardCoreTests(APITestCase):
    """
    Suite de pruebas core para el dashboard de Lead Flow.
    Cubre: KPIs, aislamiento de datos por rol, analítica de rendimiento y gestión de propiedades.
    """

    def setUp(self):
        # 1. Configuración de Usuarios y Roles
        self.admin = User.objects.create_superuser(username="admin_boss", password="password123", email="admin@flow.com")
        self.vendor = User.objects.create_user(username="vendor_juan", password="password123", email="juan@flow.com")
        
        # 2. Configuración de Catálogos
        self.source_web = Source.objects.create(name="Web Site", slug="web-site")
        self.source_fb = Source.objects.create(name="Facebook Ads", slug="facebook-ads")
        self.campaign = Campaign.objects.create(name="Inversión Providencia", slug="inv-providencia", is_active=True)

        # 3. Creación de Leads para KPIs
        # Lead Ganado (Web)
        Lead.objects.create(
            original_email="ganado@test.com", 
            first_name="Ganado", 
            first_source=self.source_web,
            assigned_to=self.vendor,
            status=Lead.Status.CIERRE_GANADO
        )
        # Lead Perdido (Facebook)
        Lead.objects.create(
            original_email="perdido@test.com", 
            first_name="Perdido", 
            first_source=self.source_fb,
            assigned_to=self.vendor,
            status=Lead.Status.CIERRE_PERDIDO
        )
        # Lead Estancado (Creado hace 2 días, sin actualizar)
        stale_date = timezone.now() - timedelta(days=2)
        stale_lead = Lead.objects.create(
            original_email="stale@test.com", 
            first_name="Stale", 
            first_source=self.source_web,
            assigned_to=self.vendor,
            status=Lead.Status.CONTACTADO
        )
        Lead.objects.filter(id=stale_lead.id).update(updated_at=stale_date)

        # Lead Nuevo (Sin asignar a nadie específico aún, asignado a admin para pruebas de aislamiento)
        Lead.objects.create(
            original_email="nuevo@test.com", 
            first_name="Nuevo", 
            first_source=self.source_fb,
            assigned_to=self.admin,
            status=Lead.Status.NUEVO
        )

        # 4. Logs de Webhooks para success rate
        WebhookLog.objects.create(source_type="web", status=WebhookLog.Status.SUCCESS, raw_body={})
        WebhookLog.objects.create(source_type="web", status=WebhookLog.Status.FAILED, raw_body={}, error_message="Error")

    def test_dashboard_stats_kpi_accuracy_admin(self):
        """Verifica que un administrador vea las métricas globales correctamente."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('dashboard-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Total leads: 4 (ganado, perdido, stale, nuevo)
        self.assertEqual(data["total_leads"], 4)
        
        # Webhook success rate: 1 success, 1 failed = 50%
        self.assertEqual(data["webhook_success_rate"], 50.0)
        
        # Stale leads count: 1 (stale@test.com)
        self.assertEqual(data["stale_leads_count"], 1)
        
        # Funnel data order and values
        # Nuevo=1, Contactado=1, Calificacion=0, Propuesta=0, Ganado=1
        funnel = {stage["label"]: stage["value"] for stage in data["funnel_data"]}
        self.assertEqual(funnel["Nuevo"], 1)
        self.assertEqual(funnel["Contactado"], 1)
        self.assertEqual(funnel["Cierre Ganado"], 1)

    def test_dashboard_stats_data_isolation_vendor(self):
        """Verifica que un vendedor solo vea métricas de sus propios leads."""
        self.client.force_authenticate(user=self.vendor)
        url = reverse('dashboard-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # El vendedor tiene 3 leads asignados (ganado, perdido, stale). El 'nuevo' es del admin.
        self.assertEqual(data["total_leads"], 3)
        
        # El funnel del vendedor no debería incluir el lead 'Nuevo' (que está asignado al admin)
        funnel = {stage["label"]: stage["value"] for stage in data["funnel_data"]}
        self.assertEqual(funnel["Nuevo"], 0)
        self.assertEqual(funnel["Contactado"], 1)

    def test_performance_analytics_ranking(self):
        """Verifica el ranking de rendimiento de vendedores."""
        # Creamos otro vendedor con 100% de conversión
        top_vendor = User.objects.create_user(username="top_v", password="pw")
        Lead.objects.create(original_email="top1@test.com", assigned_to=top_vendor, status=Lead.Status.CIERRE_GANADO)
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('analytics-performance')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # El primer vendedor en la lista debe ser 'top_v' (100% conversión)
        self.assertEqual(data[0]["vendor_name"], "top_v")
        self.assertEqual(data[0]["conversion_rate"], 100.0)
        
        # El vendedor 'juan' tiene 1 ganado de 3 totales = 33.33%
        v_juan = next(v for v in data if v["vendor_name"] == "vendor_juan")
        self.assertEqual(v_juan["conversion_rate"], 33.33)

    def test_property_management_crud_admin(self):
        """Verifica que el admin pueda gestionar el catálogo de propiedades."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('property-list')
        
        # Create
        payload = {
            "name": "Edificio Titanium",
            "slug": "edificio-titanium",
            "location": "Las Condes",
            "description": "Lujo total",
            "min_investment": 5000,
            "is_active": True
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        property_id = response.json()["id"]
        
        # Update
        update_url = reverse('property-detail', kwargs={'pk': property_id})
        response = self.client.patch(update_url, {"name": "Titanium Updated"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Property.objects.get(id=property_id).name, "Titanium Updated")
        
        # Delete
        response = self.client.delete(update_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Property.objects.count(), 0)

    def test_property_management_forbidden_for_vendor(self):
        """Verifica que un vendedor NO pueda editar propiedades."""
        self.client.force_authenticate(user=self.vendor)
        url = reverse('property-list')
        response = self.client.get(url)
        
        # El ViewSet tiene IsAdminUser
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_campaign_brochure_preview_auth(self):
        """Verifica la seguridad del token JWT para la previsualización del brochure."""
        from rest_framework_simplejwt.tokens import AccessToken
        
        self.client.force_authenticate(user=self.vendor)
        token = str(AccessToken.for_user(self.vendor))
        
        url = reverse('campaign-brochure-preview', kwargs={'pk': self.campaign.id})
        
        # Sin token -> 403
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)
        
        # Con token válido -> 200 (HTML)
        response = self.client.get(f"{url}?token={token}")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response['Content-Type'])
