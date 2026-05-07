import os
import re
import requests
import json

# --- CONFIGURACIÓN ---
# Puedes pasar estos valores como variables de entorno o editarlos aquí
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
PARENT_PAGE_ID = os.getenv("NOTION_PAGE_ID")
DOC_PATH = r"C:\Users\USER\.gemini\antigravity\brain\4c9a94e6-273f-4f19-9bdd-bb60d6d1aacb\full_documentation.md"

if not NOTION_TOKEN or not PARENT_PAGE_ID:
    print("Error: NOTION_TOKEN y NOTION_PAGE_ID son requeridos.")
    exit(1)

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

def md_to_notion_block(line):
    line = line.strip()
    if not line:
        return None

    # Headings
    if line.startswith("# "):
        return {"object": "block", "type": "heading_1", "heading_1": {"rich_text": [{"type": "text", "text": {"content": line[2:]}}]}}
    if line.startswith("## "):
        return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": line[3:]}}]}}
    if line.startswith("### "):
        return {"object": "block", "type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": line[4:]}}]}}

    # Bulleted list
    if line.startswith("* ") or line.startswith("- "):
        return {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": line[2:]}}]}}

    # Horizontal rule
    if line == "---":
        return {"object": "block", "type": "divider", "divider": {}}

    # Default to paragraph
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": line}}]}}

def process_markdown(file_path):
    blocks = []
    with open(file_path, "r", encoding="utf-8") as f:
        in_code_block = False
        code_content = []
        code_lang = "plain text"

        for line in f:
            stripped = line.strip()
            
            # Manejo de bloques de código
            if stripped.startswith("```"):
                if not in_code_block:
                    in_code_block = True
                    code_lang = stripped[3:] or "plain text"
                    if code_lang == "bash": code_lang = "shell"
                else:
                    in_code_block = False
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

            block = md_to_notion_block(line)
            if block:
                blocks.append(block)
    
    return blocks

def create_notion_page(title, blocks):
    url = "https://api.notion.com/v1/pages"
    payload = {
        "parent": {"page_id": PARENT_PAGE_ID},
        "properties": {
            "title": {
                "title": [{"text": {"content": title}}]
            }
        },
        "children": blocks
    }
    
    # La API de Notion tiene un límite de 100 hijos por petición inicial
    # Para simplificar, enviaremos los primeros 100 y luego haremos append si es necesario.
    initial_blocks = blocks[:100]
    remaining_blocks = blocks[100:]
    
    payload["children"] = initial_blocks
    
    response = requests.post(url, headers=HEADERS, json=payload)
    if response.status_code == 200:
        page_id = response.json()["id"]
        print(f"Página creada exitosamente: {response.json()['url']}")
        
        # Append remaining blocks in chunks of 100
        while remaining_blocks:
            chunk = remaining_blocks[:100]
            remaining_blocks = remaining_blocks[100:]
            append_url = f"https://api.notion.com/v1/blocks/{page_id}/children"
            append_response = requests.patch(append_url, headers=HEADERS, json={"children": chunk})
            if append_response.status_code != 200:
                print(f"Error al añadir bloques adicionales: {append_response.text}")
                break
    else:
        print(f"Error al crear la página: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print(f"Procesando {DOC_PATH}...")
    all_blocks = process_markdown(DOC_PATH)
    print(f"Total de bloques generados: {len(all_blocks)}")
    create_notion_page("Lead Flow - Documentación Técnica", all_blocks)
