"""
Lead Flow - Groups & Permissions API
====================================
Vistas para gestionar Roles (Groups) y Permisos desde el Dashboard.
Solo accesible por administradores.
"""

from django.contrib.auth.models import Group, Permission
from rest_framework import viewsets, permissions, views
from rest_framework.response import Response
from .serializers import GroupSerializer, PermissionSerializer

class GroupViewSet(viewsets.ModelViewSet):
    """
    CRUD de Roles.
    Permite crear roles personalizados y asignarles permisos.
    """
    queryset = Group.objects.all().prefetch_related('permissions', 'user_set')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class PermissionListView(views.APIView):
    """
    Lista todos los permisos disponibles en el sistema.
    Filtrado por la aplicación 'leads' para no abrumar al usuario con permisos internos de Django.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        # Solo mostramos permisos de la app 'leads' que son los relevantes para el negocio
        permissions_qs = Permission.objects.filter(content_type__app_label='leads')
        serializer = PermissionSerializer(permissions_qs, many=True)
        return Response(serializer.data)
