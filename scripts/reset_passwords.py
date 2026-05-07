import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User

def run():
    users = User.objects.all()
    for u in users:
        u.set_password("admin123")
        u.save()
        print(f"Password reset for: {u.username}")

if __name__ == "__main__":
    run()
