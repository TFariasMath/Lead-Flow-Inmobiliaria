import logging
from typing import Optional
from django.contrib.auth.models import User
from django.utils import timezone
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

class BrochureService:
    """
    Servicio especializado en la orquestación de materiales de marketing (PDF/HTML).
    """

    @staticmethod
    def get_mock_lead_for_user(user) -> object:
        class MockUser:
            def __init__(self, u):
                self.username = getattr(u, 'username', 'asesor')
                self.email = getattr(u, 'email', 'asesor@leadflow.dev')
                self.first_name = getattr(u, 'first_name', '')
                self.last_name = getattr(u, 'last_name', '')
            def get_full_name(self):
                return f"{self.first_name} {self.last_name}".strip() or self.username

        class MockLead:
            def __init__(self, u):
                self.first_name = "Inversionista"
                self.assigned_to = MockUser(u)
        
        return MockLead(user)

    @staticmethod
    def validate_jwt_token(token: str) -> Optional[User]:
        from rest_framework_simplejwt.tokens import AccessToken
        if not token: return None
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        try:
            valid_token = AccessToken(token)
            user_id = valid_token['user_id']
            return User.objects.get(id=user_id)
        except Exception as e:
            logger.error(f"Error validando token de brochure: {e}")
            return None

    @classmethod
    def get_preview_html(cls, campaign, user) -> str:
        from ..utils_pdf import get_brochure_context
        mock_lead = cls.get_mock_lead_for_user(user)
        context = get_brochure_context(mock_lead, campaign)
        context['is_preview'] = True
        return render_to_string('leads/brochure_template.html', context)

    @classmethod
    def generate_pdf_content(cls, campaign, user) -> tuple[Optional[bytes], str]:
        from ..utils_playwright import generate_campaign_brochure_playwright
        mock_lead = cls.get_mock_lead_for_user(user)
        pdf_bytes = generate_campaign_brochure_playwright(mock_lead, campaign)
        date_str = timezone.now().strftime("%Y-%m-%d")
        clean_name = "".join([c for c in campaign.name if c.isalnum() or c in (' ', '_')]).replace(' ', '_')
        filename = f"Brochure_{clean_name}_{date_str}.pdf"
        return pdf_bytes, filename
