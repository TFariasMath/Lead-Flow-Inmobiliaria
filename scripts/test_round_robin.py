import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from leads.models import Lead, RoundRobinState
from leads.services import WebhookProcessor

def run():
    print("Iniciando prueba de Round Robin...")
    
    # 1. Limpiar leads anteriores para test limpio
    Lead.objects.all().delete()
    RoundRobinState.objects.all().delete()
    
    # 2. Asegurar que tenemos al menos 2 vendedores activos
    v1, _ = User.objects.get_or_create(username="vendedor1", defaults={"is_staff": False})
    v2, _ = User.objects.get_or_create(username="vendedor2", defaults={"is_staff": False})
    v3, _ = User.objects.get_or_create(username="vendedor3", defaults={"is_staff": False})
    
    admin, _ = User.objects.get_or_create(username="admin", defaults={"is_staff": True})

    # Asegurar que los vendedores están activos y admin no entra en la rueda
    v1.is_active = True
    v1.is_staff = False
    v1.save()
    
    v2.is_active = True
    v2.is_staff = False
    v2.save()
    
    v3.is_active = True
    v3.is_staff = False
    v3.save()

    print(f"Vendedores activos: {v1.username}, {v2.username}, {v3.username}")
    
    # 3. Simular la llegada de 5 webhooks nuevos (5 correos distintos)
    emails = [
        "cliente1@mail.com",
        "cliente2@mail.com",
        "cliente3@mail.com",
        "cliente4@mail.com",
        "cliente5@mail.com",
    ]
    
    for i, email in enumerate(emails):
        payload = {"email": email, "first_name": f"Cliente {i+1}"}
        processor = WebhookProcessor(source_type="test", raw_body=payload)
        processor.create_log()
        processor.process()
        
    # 4. Verificar asignaciones
    leads = Lead.objects.all().order_by("created_at")
    print("\nResultados de asignación:")
    for lead in leads:
        print(f"- {lead.original_email} -> Asignado a: {lead.assigned_to.username if lead.assigned_to else 'Nadie'}")
        
if __name__ == "__main__":
    run()
