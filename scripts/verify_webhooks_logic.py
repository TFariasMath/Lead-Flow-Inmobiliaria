import os
import django
import sys

# Setup Django
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.services import WebhookProcessor
from leads.models import Lead, Source

def audit_source(source_type, data):
    print(f"\n--- Auditing: {source_type} ---")
    processor = WebhookProcessor(source_type=source_type, raw_body=data)
    log = processor.process()
    print(f"Status: {log.status}")
    if log.status == "success":
        lead = log.lead
        print(f"Lead Created/Updated: {lead.full_name} ({lead.original_email})")
        print(f"Phone Extracted: {lead.phone}")
        print(f"Source: {lead.first_source.slug}")
    else:
        print(f"Error: {log.error_message}")

# 1. Calendly Test
audit_source("calendly", {
    "payload": {
        "invitee": {
            "first_name": "Juan",
            "last_name": "Calendly",
            "email": "juan.cal@example.com",
            "text_reminder_number": "+56988887777"
        }
    }
})

# 2. Mailchimp Test
audit_source("mailchimp", {
    "merges": {
        "FNAME": "Maria",
        "LNAME": "Mailchimp",
        "EMAIL": "maria.mc@example.com",
        "PHONE": "+56911112222",
        "COMPANY": "Inmobiliaria MC"
    }
})

# 3. Standard Web Test
audit_source("web", {
    "first_name": "Pedro",
    "email": "pedro.web@example.com",
    "phone": "+56933334444"
})
