import logging
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from ..serializers import CustomTokenObtainPairSerializer

logger = logging.getLogger(__name__)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Controlador de autenticación personalizado.
    Extiende la lógica estándar de JWT para capturar datos de la sesión.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        """
        Sobreescribe el login exitoso para registrar una auditoría de seguridad.
        """
        username = request.data.get("username")
        password = request.data.get("password")
        logger.info(f"DEBUG LOGIN: Intentando login para usuario: '{username}' (longitud: {len(username) if username else 0})")
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code != 200:
            logger.warning(f"DEBUG LOGIN: Fallo de login para usuario: '{username}'. Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                from ..models import SessionAudit
                username = request.data.get("username")
                user = User.objects.filter(username=username).first()
                
                if user:
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                    ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    
                    # Auditamos de forma segura
                    SessionAudit.objects.create(
                        user=user,
                        ip_address=ip,
                        user_agent=user_agent
                    )
            except Exception as e:
                # Si falla la auditoría, logueamos el error pero NO bloqueamos al usuario
                logger.error(f"Error en auditoría de sesión: {e}")
                
        return response
