import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from leads.models import Lead, Campaign, LandingPage, MediaAsset, Interaction

# 1. Crear Rol Administrador
admin_group, _ = Group.objects.get_or_create(name='Administrador')
all_permissions = Permission.objects.filter(content_type__app_label='leads')
admin_group.permissions.set(all_permissions)
print("Rol 'Administrador' configurado con todos los permisos de leads.")

# 2. Crear Rol Marketing / Web Designer
marketing_group, _ = Group.objects.get_or_create(name='Marketing')
marketing_perms = Permission.objects.filter(content_type__model__in=['landingpage', 'campaign', 'mediaasset'])
marketing_group.permissions.set(marketing_perms)
print("Rol 'Marketing' configurado para gestionar paginas y campanas.")

# 3. Crear Rol Vendedor
vendedor_group, _ = Group.objects.get_or_create(name='Vendedor')
vendedor_perms = Permission.objects.filter(content_type__model__in=['lead', 'interaction']).exclude(codename__startswith='delete')
vendedor_group.permissions.set(vendedor_perms)
print("Rol 'Vendedor' configurado para gestionar leads e interacciones.")
