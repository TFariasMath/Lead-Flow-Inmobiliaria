"""
Lead Flow - Test de Distribución Round Robin
============================================
Este script valida que el algoritmo de carrusel asigne los leads de forma 
equitativa entre los vendedores activos.

Flujo del Test:
1. Limpia datos anteriores.
2. Crea/Asegura 3 vendedores activos.
3. Simula la entrada de 5 leads nuevos.
4. Imprime el resultado para verificar que se repartan (v1, v2, v3, v1, v2).
"""

import os
import sys
import django

# --- CONFIGURACIÓN DEL ENTORNO ---
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from leads.models import Lead, RoundRobinState
from leads.services import WebhookProcessor

def run():
    print("Iniciando validación del Algoritmo de Reparto...")
    
    # 1. Preparación del escenario (Limpieza)
    Lead.objects.all().delete()
    RoundRobinState.objects.all().delete()
    
    # 2. Configuración de Usuarios de Prueba
    # Creamos 3 vendedores. El admin NO debería recibir leads.
    v1, _ = User.objects.get_or_create(username="vendedor_alfa", defaults={"is_staff": False})
    v2, _ = User.objects.get_or_create(username="vendedor_beta", defaults={"is_staff": False})
    v3, _ = User.objects.get_or_create(username="vendedor_gamma", defaults={"is_staff": False})
    
    # Aseguramos que tengan perfil de vendedor y estén activos
    for v in [v1, v2, v3]:
        v.is_active = True
        v.is_staff = False
        v.save()
        # Garantizamos que su perfil permita recibir leads
        v.vendor_profile.is_available_for_leads = True
        v.vendor_profile.save()

    print(f"Vendedores en la rueda: {v1.username}, {v2.username}, {v3.username}")
    
    # 3. Simulación de Ráfaga de Leads
    # Enviamos 5 clientes seguidos.
    emails = [
        "interesado_1@gmail.com",
        "interesado_2@gmail.com",
        "interesado_3@gmail.com",
        "interesado_4@gmail.com",
        "interesado_5@gmail.com",
    ]
    
    print(f"Procesando {len(emails)} leads de prueba...")
    for i, email in enumerate(emails):
        payload = {"email": email, "first_name": f"Prospecto {i+1}"}
        # Invocamos al procesador real para testear la lógica de producción
        processor = WebhookProcessor(source_type="test-carrusel", raw_body=payload)
        processor.create_log()
        processor.process()
        
    # 4. Verificación de Resultados
    leads = Lead.objects.all().order_by("created_at")
    print("\n--- INFORME DE ASIGNACIÓN ---")
    for lead in leads:
        vendedor = lead.assigned_to.username if lead.assigned_to else "SIN ASIGNAR"
        print(f"Lead: {lead.original_email} | Asignado a: {vendedor}")
    
    print("\nTest completado. El orden debe ser cíclico.")

if __name__ == "__main__":
    run()
