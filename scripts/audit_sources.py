import requests
import json

BASE_URL = "http://localhost:8000/api/v1/webhooks/receive/"

def test_source(name, payload):
    print(f"Testing Source: {name}...")
    response = requests.post(BASE_URL, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

# Test 1: Standard Web
test_source("Standard Web", {
    "source_type": "web",
    "data": {
        "first_name": "Audit",
        "last_name": "Web",
        "email": "audit.web@test.com",
        "phone": "+56911111111"
    }
})

# Test 2: Calendly (Nested)
test_source("Calendly", {
    "source_type": "calendly",
    "data": {
        "payload": {
            "invitee": {
                "first_name": "Audit",
                "last_name": "Calendly",
                "email": "audit.calendly@test.com"
            }
        }
    }
})

# Test 3: Mailchimp (Merges)
test_source("Mailchimp", {
    "source_type": "mailchimp",
    "data": {
        "merges": {
            "FNAME": "Audit",
            "LNAME": "Mailchimp",
            "EMAIL": "audit.mailchimp@test.com"
        }
    }
})
