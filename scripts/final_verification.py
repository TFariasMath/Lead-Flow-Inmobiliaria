import os
import sys
import django

# Añadir el directorio backend al path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import WebhookLog, Lead

def final_verify():
    print("--- VERIFICACIÓN FINAL DE INTEGRIDAD ---")
    
    # 1. Verificar Dashboard Stats
    print("\n1. Verificando API de Estadísticas...")
    from leads.api.analytics import DashboardStatsView
    from rest_framework.test import APIRequestFactory, force_authenticate
    from django.contrib.auth.models import User
    
    factory = APIRequestFactory()
    user = User.objects.get(username='admin')
    request = factory.get('/api/v1/dashboard/stats/', {'days': '7'})
    force_authenticate(request, user=user)
    view = DashboardStatsView.as_view()
    response = view(request)
    
    if response.status_code != 200:
        print(f"ERROR: La API devolvio status {response.status_code}")
        print(response.data)
        return

    data = response.data
    print(f" > Total Leads: {data.get('total_leads')}")
    print(f" > Leads via API: {data.get('leads_via_api')}")
    print(f" > Leads Manuales: {data.get('leads_manual')}")
    print(f" > Salud API: {data.get('webhook_success_rate')}%")
    print(f" > Fallos detectados: {data.get('failed_webhooks')}")
    
    # 2. Verificar Visibilidad de Logs Fallidos
    print("\n2. Verificando Visibilidad de Logs en API...")
    from leads.api.webhooks import WebhookLogViewSet
    request_logs = factory.get('/api/v1/webhook-logs/', {'status': 'failed'})
    force_authenticate(request_logs, user=user)
    view_logs = WebhookLogViewSet.as_view({'get': 'list'})
    response_logs = view_logs(request_logs)
    
    failed_count = response_logs.data.get('count', 0)
    print(f" > Logs fallidos devueltos por API: {failed_count}")
    
    # 3. Consistencia Matematica
    if data.get('total_leads') == data.get('leads_via_api') + data.get('leads_manual'):
        print("\nEXITO: Los contadores de leads son consistentes.")
    else:
        print("\nERROR: Discrepancia en contadores de leads.")
        
    if failed_count > 0:
        print("EXITO: Los logs fallidos son visibles para el administrador.")
    else:
        print("ERROR: Los logs fallidos siguen ocultos en la API.")

if __name__ == "__main__":
    final_verify()
