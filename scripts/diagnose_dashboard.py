import os
import sys
import django
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q

# Añadir el directorio backend al path para que encuentre 'config' y 'leads'
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import Lead, WebhookLog, Source

def run_diagnostics():
    now = timezone.now()
    seven_days_ago = now - timedelta(days=7)
    
    print("--- DIAGNÓSTICO DE BASE DE DATOS ---")
    
    # 1. Leads
    total_leads = Lead.objects.count()
    leads_7d = Lead.objects.filter(created_at__gte=seven_days_ago).count()
    print(f"Total Leads (Global): {total_leads}")
    print(f"Total Leads (7 Días): {leads_7d}")
    
    # 2. Webhooks
    total_webhooks = WebhookLog.objects.count()
    webhooks_7d = WebhookLog.objects.filter(created_at__gte=seven_days_ago).count()
    failed_webhooks_all = WebhookLog.objects.filter(status='failed').count()
    failed_webhooks_7d = WebhookLog.objects.filter(created_at__gte=seven_days_ago, status='failed').count()
    
    print(f"Total Webhooks (Global): {total_webhooks}")
    print(f"Total Webhooks (7 Días): {webhooks_7d}")
    print(f"Webhooks Fallidos (Global): {failed_webhooks_all}")
    print(f"Webhooks Fallidos (7 Días): {failed_webhooks_7d}")
    
    if webhooks_7d > 0:
        health_7d = ((webhooks_7d - failed_webhooks_7d) / webhooks_7d) * 100
        print(f"Cálculo Salud API (7D): {health_7d:.2f}%")
    
    # 3. Discrepancia Lead vs Webhook
    # ¿Cuántos leads NO tienen un webhook asociado?
    leads_without_log = Lead.objects.filter(webhook_logs__isnull=True).count()
    print(f"Leads sin WebhookLog asociado: {leads_without_log}")
    
    # 4. Orígenes
    print("\n--- DISTRIBUCIÓN POR ORIGEN (LEADS) ---")
    sources = Lead.objects.values('first_source__name').annotate(count=Count('id'))
    for s in sources:
        print(f" - {s['first_source__name'] or 'None'}: {s['count']}")

    # 5. Estados de Webhooks
    print("\n--- ESTADOS DE WEBHOOKS ---")
    status_counts = WebhookLog.objects.values('status').annotate(count=Count('id'))
    for sc in status_counts:
        print(f" - {sc['status']}: {sc['count']}")

run_diagnostics()
