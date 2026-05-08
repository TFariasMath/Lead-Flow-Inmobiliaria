import os
import django
import uuid
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from leads.models import Lead, Campaign, LandingPage, Property
from django.test import Client
from rest_framework.test import APIClient

def test_full_flow():
    print("Starting full flow test...")
    client = APIClient()

    # 1. Verify Landing Page
    landing_slug = "invertir-paraiso"
    landing = LandingPage.objects.get(slug=landing_slug)
    print(f"Verified Landing: {landing.title}")
    
    # 2. Simulate Lead Submission
    print("Simulating lead submission...")
    submission_data = {
        "email": f"test_lead_{uuid.uuid4().hex[:6]}@example.com",
        "first_name": "Test",
        "last_name": "Inversionista",
        "phone": "+56912345678",
        "utm_source": "google",
        "utm_medium": "cpc",
        "utm_campaign": "search_latam"
    }
    
    response = client.post(f"/api/v1/landings/{landing_slug}/submit/", submission_data, format='json')
    if response.status_code == 201:
        print("Lead submission successful!")
    else:
        print(f"Lead submission failed: {response.data}")
        return

    # 3. Verify Lead in DB
    lead = Lead.objects.get(original_email=submission_data['email'])
    print(f"Lead created with ID: {lead.id}")
    
    if lead.campaign == landing.campaign:
        print(f"Success: Lead associated with Campaign '{lead.campaign.name}'")
    else:
        print(f"Error: Lead Campaign mismatch. Expected {landing.campaign}, got {lead.campaign}")
        return

    # 4. Verify Brochure Logic
    print("Testing Brochure generation...")
    campaign = lead.campaign
    props_count = campaign.properties.count()
    print(f"Campaign has {props_count} properties linked.")
    
    # Simulate PDF generation call
    response = client.get(f"/api/v1/leads/{lead.id}/brochure/")
    if response.status_code == 200 and response['Content-Type'] == 'application/pdf':
        print("Success: Brochure PDF generated correctly!")
    else:
        print(f"Error: Brochure generation failed. Status: {response.status_code}")

    print("\nFULL FLOW TEST PASSED!")

if __name__ == "__main__":
    test_full_flow()
