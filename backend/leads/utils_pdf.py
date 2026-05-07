"""
Lead Flow - PDF Generation Utility
==================================
Servicio para transformar plantillas HTML en documentos PDF descargables.
Utiliza la librería xhtml2pdf (Pisa) para el renderizado.
"""

import os
from io import BytesIO
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.conf import settings

def generate_personalized_brochure(lead, campaign):
    """
    Motor de generación de Brochures PDF.
    Cruza los datos personales del Lead con la configuración visual de la Campaña.
    """
    # Ruta de la plantilla HTML base para el brochure
    template_path = 'leads/brochure_template.html'
    
    # 1. Preparar el Contexto (Datos dinámicos)
    # Buscamos el color de la landing page vinculada para mantener la identidad visual
    landing = campaign.landing_pages.first()
    context = {
        'lead': lead,
        'campaign': campaign,
        'primary_color': landing.primary_color if landing else '#3b82f6',
        'brochure_title': campaign.brochure_title or f"Propuesta para {lead.first_name}",
        'brochure_description': campaign.brochure_description,
        'brochure_features': campaign.brochure_features,
    }
    
    # 2. Renderizar el HTML con Django
    template = get_template(template_path)
    html = template.render(context)
    
    # 3. Conversión a PDF mediante flujo de memoria (BytesIO)
    result = BytesIO()
    # Importante: encode("UTF-8") para soportar acentos y caracteres especiales
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    
    # Si la conversión fue exitosa, retornamos los bytes del documento
    if not pdf.err:
        return result.getvalue()
    
    # Manejo de error silencioso (el llamador en api.py manejará el 404/500)
    return None
