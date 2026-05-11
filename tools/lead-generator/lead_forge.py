import streamlit as st
import requests
import random
import time
import pandas as pd
from faker import Faker
import concurrent.futures
from datetime import datetime
import os
import json

# Configuración de Faker
fake = Faker(['es_ES', 'es_MX', 'en_US'])

# Configuración de página Premium
st.set_page_config(
    page_title="Lead Forge Pro | Resilience Console",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- THEME & CSS ---
def inject_super_premium_styles():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');

        :root {
            --primary: #3b82f6;
            --primary-glow: rgba(59, 130, 246, 0.5);
            --secondary: #6366f1;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --bg-dark: #020617;
            --card-bg: rgba(15, 23, 42, 0.6);
            --border: rgba(255, 255, 255, 0.08);
        }

        .main {
            background: radial-gradient(circle at top right, #1e1b4b, var(--bg-dark));
            color: #f1f5f9;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .glass-card {
            background: var(--card-bg);
            backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 32px;
            margin-bottom: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .stTabs [data-baseweb="tab-list"] {
            gap: 12px;
            background-color: rgba(2, 6, 23, 0.8);
            padding: 10px;
            border-radius: 20px;
            border: 1px solid var(--border);
        }

        .stTabs [data-baseweb="tab"] {
            border-radius: 14px;
            padding: 12px 24px;
            font-weight: 700;
        }

        .stTabs [data-baseweb="tab"][aria-selected="true"] {
            background: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
            color: white !important;
        }

        .metric-card {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 18px;
            padding: 20px;
            border: 1px solid var(--border);
            text-align: center;
        }

        .metric-val {
            font-size: 2.4rem;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
        }

        .status-pulse {
            width: 12px; height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .terminal {
            background: #000;
            color: #00ff00;
            font-family: 'JetBrains Mono', monospace;
            padding: 15px;
            border-radius: 8px;
            font-size: 0.8rem;
            border: 1px solid #333;
            max-height: 400px;
            overflow-y: auto;
        }
        </style>
    """, unsafe_allow_html=True)

inject_super_premium_styles()

# --- PROJECT ALIGNMENT (v2.5.0: Calendly & Mailchimp Integration) ---
PROJECT_SOURCES = {
    "Web Form (Slug: web)": "web",
    "Calendly / Agendamiento (Slug: calendly)": "calendly",
    "Mailchimp / Email Marketing (Slug: mailchimp)": "mailchimp",
    "Facebook Ads (Slug: facebook)": "facebook",
    "Instagram Ads (Slug: instagram)": "instagram",
    "Google Ads (Slug: google)": "google",
    "Portal Inmobiliario (Slug: portal_inmo)": "portal_inmo",
    "Tokko Broker (Slug: tokko)": "tokko",
    "Direct API (Slug: api)": "api"
}

# --- UTILS ---
def send_webhook(url, payload):
    start_time = time.time()
    try:
        response = requests.post(url, json=payload, timeout=10)
        latency = time.time() - start_time
        return response.status_code, response.json() if response.status_code == 200 else response.text, latency
    except Exception as e:
        return 0, str(e), time.time() - start_time

def generate_domain_lead():
    fn = fake.first_name()
    ln = fake.last_name()
    return {
        "first_name": fn,
        "last_name": ln,
        "email": f"{fn.lower()}.{ln.lower()}{random.randint(1,99)}@{fake.free_email_domain()}",
        "phone": f"+569{random.randint(11111111, 99999999)}",
        "company": fake.company(),
        "investment_goal": random.choice(["plusvalia", "renta", "patrimonio"]),
        "investment_capacity": random.choice(["$50M", "$100M", "$200M"])
    }

# --- HEADER ---
col_l, col_t = st.columns([1, 6])
with col_l:
    logo_path = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\6b034929-29ff-4b49-b6f4-25ff0cd47e37\\lead_forge_pro_logo_1778499350441.png"
    if os.path.exists(logo_path): st.image(logo_path, width=100)
    else: st.markdown("<h1 style='font-size: 4rem;'>🛡️</h1>", unsafe_allow_html=True)

with col_t:
    st.markdown("""
        <div style='margin-top: 10px;'>
            <h1 style='margin-bottom: 0; font-size: 3.5rem; letter-spacing: -3px;'>
                Lead Forge <span style='background: linear-gradient(135deg, #3b82f6, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'>PRO</span>
            </h1>
            <p style='color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3em; font-size: 0.8rem;'>
                Calendly & Mailchimp Integration v2.5.0
            </p>
        </div>
    """, unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("### 🌐 NODE CONFIG")
    target_url = st.text_input("WEBHOOK ENDPOINT", value="http://localhost:8000/api/v1/webhooks/receive/")
    
    st.divider()
    st.markdown("### 📡 SYSTEM PULSE")
    try:
        ping = requests.get(target_url.replace("webhooks/receive/", ""), timeout=2)
        st.markdown(f"""
            <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); padding: 15px; border-radius: 12px;">
                <span class="status-pulse" style="background: #10b981;"></span>
                <span style="color: #10b981; font-weight: 800; font-size: 0.9rem;">BACKEND READY</span>
            </div>
        """, unsafe_allow_html=True)
    except:
        st.error("BACKEND DESCONECTADO")

# Navigation
tab1, tab2, tab3 = st.tabs(["🚀 INYECTOR MULTI-FUENTE", "🧬 LAB DE IDENTIDAD", "🌊 STRESS HYDRA"])

# --- TAB 1: INYECTOR ---
with tab1:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    c1, c2 = st.columns([1, 1.2])
    
    with c1:
        st.markdown("### ⚙️ SIMULACIÓN DE CANAL")
        source_label = st.selectbox("SERVICIO ORIGEN", list(PROJECT_SOURCES.keys()))
        schema = st.radio("TIPO DE INTEGRACIÓN", ["Direct Webhook", "Calendly Event Payload", "Mailchimp Contact Hook"])
        count = st.select_slider("VOLUMEN", options=[1, 5, 10, 20, 50], value=5)
        
        source_slug = PROJECT_SOURCES[source_label]

        if st.button("🚀 INICIAR CAPTURA", type="primary", use_container_width=True):
            results = []
            progress = st.progress(0)
            for i in range(count):
                lead = generate_domain_lead()
                
                if schema == "Calendly Event Payload":
                    # Simulación de estructura de Calendly
                    payload = {
                        "source_type": "calendly",
                        "data": {
                            "payload": {
                                "invitee": {
                                    "first_name": lead["first_name"],
                                    "last_name": lead["last_name"],
                                    "email": lead["email"],
                                    "text_reminder_number": lead["phone"]
                                },
                                "event": "Reunión Inversión Inmobiliaria"
                            }
                        }
                    }
                elif schema == "Mailchimp Contact Hook":
                    # Simulación de estructura de Mailchimp
                    payload = {
                        "source_type": "mailchimp",
                        "data": {
                            "merges": {
                                "FNAME": lead["first_name"],
                                "LNAME": lead["last_name"],
                                "EMAIL": lead["email"],
                                "PHONE": lead["phone"]
                            },
                            "list_id": "mc_list_99"
                        }
                    }
                else:
                    payload = {"source_type": source_slug, "data": lead}
                
                sc, data, lat = send_webhook(target_url, payload)
                results.append({"status": sc, "latency": lat, "email": lead["email"], "source": source_slug})
                progress.progress((i+1)/count)
            
            st.session_state.inj_results = results
            st.success(f"Captura desde {source_label} completada.")

    with c2:
        if 'inj_results' in st.session_state:
            df = pd.DataFrame(st.session_state.inj_results)
            st.markdown("### 📊 MONITOREO")
            st.dataframe(df, use_container_width=True)
            st.line_chart(df['latency'])
        else:
            st.info("Selecciona un servicio (Calendly, Mailchimp, etc.) para probar la ingesta.")

    st.markdown('</div>', unsafe_allow_html=True)

# --- TAB 2: LAB DE IDENTIDAD ---
with tab2:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown("### 🧬 RESOLUCIÓN MULTI-CANAL")
    st.write("Verifica si un lead que llega por Mailchimp y luego agenda en Calendly se unifica correctamente.")
    
    if 'lab_lead_v2' not in st.session_state:
        st.session_state.lab_lead_v2 = generate_domain_lead()

    c1, c2 = st.columns(2)
    
    with c1:
        st.markdown("<div style='background:rgba(255,255,255,0.03); border:1px solid var(--border); padding:20px; border-radius:20px;'>", unsafe_allow_html=True)
        st.write("**Evento A: Campaña Email**")
        st.caption("Captura desde Mailchimp")
        st.code(f"Email: {st.session_state.lab_lead_v2['email']}")
        if st.button("1. Enviar desde Mailchimp"):
            send_webhook(target_url, {"source_type": "mailchimp", "data": st.session_state.lab_lead_v2})
            st.toast("Enviado a Mailchimp")
        st.markdown("</div>", unsafe_allow_html=True)

    with c2:
        st.markdown("<div style='background:rgba(59,130,246,0.05); border:1px solid rgba(59,130,246,0.2); padding:20px; border-radius:20px;'>", unsafe_allow_html=True)
        st.write("**Evento B: Agendamiento**")
        st.caption("Mismo Email desde Calendly")
        st.code(f"Email: {st.session_state.lab_lead_v2['email']}")
        if st.button("2. Enviar desde Calendly"):
            send_webhook(target_url, {"source_type": "calendly", "data": st.session_state.lab_lead_v2})
            st.toast("Agendado en Calendly")
        st.markdown("</div>", unsafe_allow_html=True)

    st.warning("El Backend debe reconocer que es la misma persona y añadir la interacción de Calendly al historial del lead de Mailchimp.")
    st.markdown('</div>', unsafe_allow_html=True)

# --- TAB 3: STRESS HYDRA ---
with tab3:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.markdown("### 🌊 MULTI-SOURCE HYDRA STRESS")
    
    col_h1, col_h2 = st.columns([1, 2])
    with col_h1:
        threads = st.slider("CONCURRENCIA", 1, 100, 40)
        total = st.select_slider("ATAQUE", options=[100, 500, 1000], value=100)
        
        if st.button("🔥 LANZAR ATAQUE MULTI-CANAL", type="primary", use_container_width=True):
            results = []
            start = time.time()
            bar = st.progress(0)
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=threads) as executor:
                futures = []
                for _ in range(total):
                    lead = generate_domain_lead()
                    # Rotación de fuentes reales
                    s = random.choice(["web", "calendly", "mailchimp", "facebook"])
                    futures.append(executor.submit(send_webhook, target_url, {"source_type": s, "data": lead}))
                
                for i, future in enumerate(concurrent.futures.as_completed(futures)):
                    sc, data, lat = future.result()
                    results.append({"status": sc, "latency": lat})
                    bar.progress((i+1)/total)
            
            dur = time.time() - start
            df_h = pd.DataFrame(results)
            st.session_state.hydra_res_v2 = (df_h, dur)

    with col_h2:
        if 'hydra_res_v2' in st.session_state:
            df_h, dur = st.session_state.hydra_res_v2
            st.markdown("#### 📉 MÉTRICAS")
            c1, c2, c3 = st.columns(3)
            c1.metric("LOAD", f"{len(df_h)/dur:.1f} r/s")
            c2.metric("P99", f"{df_h['latency'].quantile(0.99):.3f}s")
            c3.metric("ERRORS", len(df_h[df_h['status']!=200]))
            st.area_chart(df_h['latency'], color="#3b82f6")

    st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("<div style='text-align: center; padding: 40px; color: #475569; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;'>Lead Forge Pro &bull; Multi-Source Suite v2.5.0 &bull; © 2026 Lead Flow Systems</div>", unsafe_allow_html=True)
