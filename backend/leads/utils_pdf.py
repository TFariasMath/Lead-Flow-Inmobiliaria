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

def get_brochure_context(lead, campaign):
    """
    Prepara todos los datos necesarios para renderizar el brochure.
    Reutilizado tanto por xhtml2pdf como por Playwright.
    """
    landing = campaign.landing_pages.first()
    properties_list = list(campaign.properties.all().select_related('main_image'))
    
    mapbox_token = os.environ.get("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN")
    if not mapbox_token:
        mapbox_token = None

    for prop in properties_list:
        if prop.main_image and hasattr(prop.main_image, 'file') and prop.main_image.file:
            prop.image_url = f"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop"
        else:
            prop.image_url = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"

        if prop.latitude and prop.longitude and mapbox_token:
            prop.map_static_url = (
                f"https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/"
                f"pin-s+3b82f6({prop.longitude},{prop.latitude})/"
                f"{prop.longitude},{prop.latitude},15,0/600x300?access_token={mapbox_token}"
            )
        else:
            prop.map_static_url = None

    return {
        'lead': lead,
        'campaign': campaign,
        'properties': properties_list,
        'primary_color': landing.primary_color if landing else '#3b82f6',
        'brochure_title': campaign.brochure_title or f"Propuesta para {getattr(lead, 'first_name', 'Cliente')}",
        'brochure_description': campaign.brochure_description,
        'brochure_features': campaign.brochure_features,
    }

def generate_personalized_brochure(lead, campaign):
    """
    Motor de generación de Brochures PDF (Legado - xhtml2pdf).
    """
    template_path = 'leads/brochure_template.html'
    context = get_brochure_context(lead, campaign)
    
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
