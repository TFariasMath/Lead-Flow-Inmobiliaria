from django.contrib.auth.models import User, Group, Permission
from rest_framework import viewsets, permissions
from ..models import SentEmail
from ..serializers import (
    UserSerializer, GroupSerializer, PermissionSerializer, SentEmailSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    """
    Gestión completa de usuarios (vendedores y administradores).
    Permite crear nuevos perfiles y asignarles roles.
    """
    queryset = User.objects.all().prefetch_related('groups')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = None # Mantenemos lista plana para compatibilidad con dropdowns

    def perform_create(self, serializer):
        # Guardar usuario y manejar password si viene en el request
        user = serializer.save()
        if 'password' in self.request.data and self.request.data['password']:
            user.set_password(self.request.data['password'])
            user.save()

    def perform_update(self, serializer):
        # Detectar si se está enviando una nueva contraseña en la actualización
        user = serializer.save()
        if 'password' in self.request.data and self.request.data['password']:
            user.set_password(self.request.data['password'])
            user.save()


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Visualización de los permisos disponibles en el sistema."""
    queryset = Permission.objects.filter(content_type__app_label="leads")
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = None # Retornamos lista plana para simplificar el frontend

class GroupViewSet(viewsets.ModelViewSet):
    """Gestión de Roles (Grupos de Django) y sus permisos asociados."""
    queryset = Group.objects.all().prefetch_related('permissions', 'user_set')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


class SentEmailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualizar los correos electrónicos enviados.
    Útil para que el vendedor vea qué se le ha enviado al cliente.
    """
    queryset = SentEmail.objects.all()
    serializer_class = SentEmailSerializer
    filterset_fields = ["lead", "to_email", "status"]
    search_fields = ["subject", "to_email", "body_text"]
