from leads.models import WebhookLog, Lead

def check_scenario(email, title):
    print(f"\n--- {title} ---")
    log = WebhookLog.objects.filter(raw_body__email=email).first()
    if not log:
        print("Log no encontrado.")
        return
    print(f"Status: {log.status}")
    if log.lead:
        print(f"Lead ID: {log.lead.id}")
        print(f"First Name (len): {len(log.lead.first_name)}")
        print(f"Phone: {log.lead.phone}")
        print(f"Phone Type: {type(log.lead.phone)}")
    else:
        print("Lead no creado.")

check_scenario("long@test.com", "NOMBRE GIGANTE")
check_scenario("nested@test.com", "DATOS ANIDADOS")
