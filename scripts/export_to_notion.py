"""
Lead Flow - Exportador de Documentación a Notion
===============================================
Este script automatiza la transferencia de la documentación técnica (Markdown) 
hacia un espacio de trabajo en Notion mediante su API oficial.

Requisitos:
- NOTION_TOKEN: Token de integración secreto.
- NOTION_PAGE_ID: ID de la página padre donde se creará la documentación.
"""

import os
import re
import requests
import json

# --- CONFIGURACIÓN DE ENTORNO ---
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
PARENT_PAGE_ID = os.getenv("NOTION_PAGE_ID")
# Ruta absoluta al archivo de documentación generado
DOC_PATH = r"C:\Users\USER\.gemini\antigravity\brain\4c9a94e6-273f-4f19-9bdd-bb60d6d1aacb\full_documentation.md"

if not NOTION_TOKEN or not PARENT_PAGE_ID:
    print("Error: Se requieren las variables de entorno NOTION_TOKEN y NOTION_PAGE_ID.")
    exit(1)

# Cabeceras requeridas por la API de Notion
HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28" # Versión de la API utilizada
}

def md_to_notion_block(line):
    """
    Traduce una línea de Markdown a un objeto JSON compatible con bloques de Notion.
    Soporta: Títulos (H1, H2, H3), Listas, Divisores y Párrafos.
    """
    line = line.strip()
    if not line:
        return None

    # Mapeo de Títulos
    if line.startswith("# "):
        return {"object": "block", "type": "heading_1", "heading_1": {"rich_text": [{"type": "text", "text": {"content": line[2:]}}]}}
    if line.startswith("## "):
        return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": line[3:]}}]}}
    if line.startswith("### "):
        return {"object": "block", "type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": line[4:]}}]}}

    # Mapeo de Listas (Bulleted)
    if line.startswith("* ") or line.startswith("- "):
        return {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": line[2:]}}]}}

    # Mapeo de Línea Horizontal (Divider)
    if line == "---":
        return {"object": "block", "type": "divider", "divider": {}}

    # Por defecto, se trata como un párrafo de texto normal
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": line}}]}}

def process_markdown(file_path):
    """
    Lee el archivo de texto y lo descompone en una lista de bloques de Notion.
    Maneja bloques de código multi-línea con sintaxis resaltada.
    """
    blocks = []
    with open(file_path, "r", encoding="utf-8") as f:
        in_code_block = False
        code_content = []
        code_lang = "plain text"

        for line in f:
            stripped = line.strip()
            
            # Detección de inicio/fin de bloques de código (```)
            if stripped.startswith("```"):
                if not in_code_block:
                    in_code_block = True
                    code_lang = stripped[3:] or "plain text"
                    if code_lang == "bash": code_lang = "shell"
                else:
                    in_code_block = False
                    # Cerramos el bloque de código y lo añadimos como un bloque único en Notion
                    blocks.append({
                        "object": "block",
                        "type": "code",
                        "code": {
                            "rich_text": [{"type": "text", "text": {"content": "\n".join(code_content)}}],
                            "language": code_lang
                        }
                    })
                    code_content = []
                continue

            if in_code_block:
                code_content.append(line.rstrip())
                continue

            # Procesamiento de líneas normales fuera de bloques de código
            block = md_to_notion_block(line)
            if block:
                blocks.append(block)
    
    return blocks

def create_notion_page(title, blocks):
    """
    Orquestador de la petición a la API.
    Notion limita la creación inicial a 100 bloques; los excedentes se añaden vía PATCH.
    """
    url = "https://api.notion.com/v1/pages"
    
    # Preparación del payload inicial (Título y primeros 100 bloques)
    initial_blocks = blocks[:100]
    remaining_blocks = blocks[100:]
    
    payload = {
        "parent": {"page_id": PARENT_PAGE_ID},
        "properties": {
            "title": {
                "title": [{"text": {"content": title}}]
            }
        },
        "children": initial_blocks
    }
    
    print(f"Enviando petición inicial para crear página '{title}'...")
    response = requests.post(url, headers=HEADERS, json=payload)
    
    if response.status_code == 200:
        page_id = response.json()["id"]
        print(f"¡Éxito! Página creada en: {response.json()['url']}")
        
        # Envío de bloques restantes en ráfagas (chunks) de 100
        while remaining_blocks:
            chunk = remaining_blocks[:100]
            remaining_blocks = remaining_blocks[100:]
            append_url = f"https://api.notion.com/v1/blocks/{page_id}/children"
            
            print(f"Añadiendo fragmento de {len(chunk)} bloques adicionales...")
            append_response = requests.patch(append_url, headers=HEADERS, json={"children": chunk})
            
            if append_response.status_code != 200:
                print(f"Error parcial al sincronizar bloques: {append_response.text}")
                break
    else:
        print(f"Error crítico al crear la página (Status {response.status_code}):")
        print(response.text)

if __name__ == "__main__":
    # Punto de entrada principal del script
    print(f"Iniciando exportación de: {DOC_PATH}")
    if not os.path.exists(DOC_PATH):
        print("Error: El archivo de origen no existe.")
    else:
        all_blocks = process_markdown(DOC_PATH)
        print(f"Se generaron {len(all_blocks)} bloques de contenido.")
        create_notion_page("Lead Flow - Documentación Técnica", all_blocks)
