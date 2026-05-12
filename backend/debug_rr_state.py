import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from leads.models import RoundRobinState

def debug_rr():
    state = RoundRobinState.get_state()
    last_id = state.last_assigned_user_id
    print(f"DEBUG: Last Assigned User ID: {last_id}")
    
    active_vendors = User.objects.filter(
        is_active=True, 
        is_staff=False,
        vendor_profile__is_available_for_leads=True
    ).order_by('id')
    
    print("DEBUG: Active & Available Vendors for Round Robin:")
    vendor_ids = []
    for v in active_vendors:
        print(f" - ID: {v.id}, Username: {v.username}, Available: {v.vendor_profile.is_available_for_leads}")
        vendor_ids.append(v.id)
    
    if not vendor_ids:
        print("DEBUG: NO VENDORS AVAILABLE")
        return

    # Logic to find NEXT
    next_id = vendor_ids[0]
    if last_id in vendor_ids:
        idx = vendor_ids.index(last_id)
        next_id = vendor_ids[(idx + 1) % len(vendor_ids)]
    
    print(f"DEBUG: Calculated NEXT User ID: {next_id}")
    
    # Check Ana specifically if she exists
    ana = User.objects.filter(username__icontains="ana").first()
    if ana:
        print(f"DEBUG: Ana Profile -> ID: {ana.id}, Available: {ana.vendor_profile.is_available_for_leads}, Is Staff: {ana.is_staff}")

if __name__ == "__main__":
    debug_rr()
