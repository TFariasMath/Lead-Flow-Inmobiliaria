import os
from io import BytesIO
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.conf import settings

def generate_personalized_brochure(lead, campaign):
    """
    Genera un PDF personalizado para un lead y una campaña específicos.
    Retorna un objeto BytesIO con el contenido del PDF.
    """
    template_path = 'leads/brochure_template.html'
    
    # Datos para el template
    context = {
        'lead': lead,
        'campaign': campaign,
        'primary_color': campaign.landing_pages.first().primary_color if campaign.landing_pages.exists() else '#3b82f6',
        'brochure_title': campaign.brochure_title,
        'brochure_description': campaign.brochure_description,
        'brochure_features': campaign.brochure_features,
    }
    
    # Renderizar HTML
    template = get_template(template_path)
    html = template.render(context)
    
    # Crear PDF
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    
    if not pdf.err:
        return result.getvalue()
    return None
