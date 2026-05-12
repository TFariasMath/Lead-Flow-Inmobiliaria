
import requests
import random
import time
from faker import Faker

fake = Faker(['es_ES', 'es_MX'])
target_url = "http://localhost:8000/api/v1/webhooks/receive/"

def generate_lead():
    fn = fake.first_name()
    ln = fake.last_name()
    return {
        "first_name": fn,
        "last_name": ln,
        "email": f"{fn.lower()}.{ln.lower()}{random.randint(1,99)}@{fake.free_email_domain()}",
        "phone": f"+569{random.randint(11111111, 99999999)}",
        "investment_goal": random.choice(["plusvalia", "renta", "patrimonio"]),
        "investment_capacity": random.choice(["$50M", "$100M", "$200M"])
    }

def run_simulation(count=20):
    sources = ["facebook", "google", "instagram", "calendly", "mailchimp"]
    print(f"--- Iniciando bombardeo de {count} leads hacia {target_url} ---")
    
    for i in range(count):
        source = random.choice(sources)
        lead = generate_lead()
        
        if source == "calendly":
            payload = {
                "source_type": "calendly",
                "data": {
                    "payload": {
                        "invitee": {
                            "first_name": lead["first_name"],
                            "last_name": lead["last_name"],
                            "email": lead["email"],
                            "text_reminder_number": lead["phone"]
                        }
                    }
                }
            }
        elif source == "mailchimp":
            payload = {
                "source_type": "mailchimp",
                "data": {
                    "merges": {
                        "FNAME": lead["first_name"],
                        "LNAME": lead["last_name"],
                        "EMAIL": lead["email"],
                        "PHONE": lead["phone"]
                    }
                }
            }
        else:
            payload = {"source_type": source, "data": lead}
            
        try:
            res = requests.post(target_url, json=payload, timeout=5)
            print(f"[{i+1}/{count}] Enviado via {source}: Status {res.status_code}")
        except Exception as e:
            print(f"Error en lead {i+1}: {e}")
        
        time.sleep(0.1)

if __name__ == "__main__":
    run_simulation(20)
