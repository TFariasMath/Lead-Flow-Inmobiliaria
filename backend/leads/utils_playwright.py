"""
Lead Flow - Playwright PDF Generator (Gold Standard)
===================================================
Utiliza un navegador Chromium real para renderizar brochures con 
máxima fidelidad visual, soportando CSS3 moderno y WebFonts.
"""

import os
import asyncio
from playwright.async_api import async_playwright
from django.conf import settings
from django.template.loader import render_to_string

async def generate_pdf_with_playwright(html_content):
    """
    Toma un string HTML y lo convierte en PDF usando Chromium.
    """
    async with async_playwright() as p:
        # Lanzamos el navegador con flags de optimización para velocidad
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--no-first-run",
                "--no-zygote",
                "--single-process"
            ]
        )
        page = await browser.new_page()
        
        # Cargamos el contenido HTML con un tiempo de espera más agresivo
        # Usamos 'load' en lugar de 'networkidle' para no esperar a analytics u otros scripts lentos
        await page.set_content(html_content, wait_until="load")
        
        # Damos un pequeño respiro para que las imágenes locales se procesen (200ms)
        await asyncio.sleep(0.5)
        
        # Generamos el PDF
        pdf_bytes = await page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"},
            display_header_footer=False,
            prefer_css_page_size=True
        )
        
        await browser.close()
        return pdf_bytes

def generate_campaign_brochure_playwright(lead, campaign):
    """
    Función síncrona envolvente para usar en las vistas de Django.
    """
    from .utils_pdf import generate_personalized_brochure # Reutilizamos la lógica de contexto
    
    # 1. Obtenemos el contexto y renderizamos a HTML (lo mismo que antes)
    # Importamos aquí para evitar ciclos
    from .utils_pdf import get_brochure_context
    context = get_brochure_context(lead, campaign)
    html = render_to_string('leads/brochure_template.html', context)
    
    # 2. Ejecutamos el motor de Playwright (asíncrono) en un loop síncrono
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        pdf_bytes = loop.run_until_complete(generate_pdf_with_playwright(html))
        loop.close()
        return pdf_bytes
    except Exception as e:
        print(f"Error en Playwright: {e}")
        return None
