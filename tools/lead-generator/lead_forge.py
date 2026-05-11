import streamlit as st
import requests
import random
import time
import pandas as pd
from faker import Faker
import concurrent.futures
from datetime import datetime

# Configuración de Faker
fake = Faker(['es_ES', 'es_MX', 'en_US'])

# Configuración de página Premium
st.set_page_config(
    page_title="Lead Forge Pro | Resilience Console",
    page_icon="🛡️",
    layout="wide"
)

# Estilos inyectados
st.markdown("""
    <style>
    .main { background-color: #0e1117; }
    .stTabs [data-baseweb="tab-list"] { gap: 24px; }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: #1e2130;
        border-radius: 4px 4px 0px 0px;
        gap: 1px;
        padding-top: 10px;
        padding-bottom: 10px;
    }
    .metric-card {
        background-color: #1e2130;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #3e445e;
    }
    </style>
    """, unsafe_allow_html=True)

# --- UTILIDADES ---

def send_webhook(url, payload):
    start_time = time.time()
    try:
        response = requests.post(url, json=payload, timeout=10)
        latency = time.time() - start_time
        return response.status_code, response.text, latency
    except Exception as e:
        return 0, str(e), time.time() - start_time

def generate_base_lead():
    fn = fake.first_name()
    ln = fake.last_name()
    return {
        "first_name": fn,
        "last_name": ln,
        "email": f"{fn.lower()}.{ln.lower()}@{fake.free_email_domain()}",
        "phone": f"+569{random.randint(10000000, 99999999)}",
        "investment_goal": random.choice(["Vivienda", "Inversión", "Plusvalía"]),
        "investment_capacity": random.choice(["$50M", "$100M", "$200M"]),
        "company": fake.company()
    }

# --- INTERFAZ PRINCIPAL ---

st.title("🛡️ Lead Forge Pro")
st.caption("Consola de Auditoría y Resiliencia para Lead Flow")

# Sidebar Global
with st.sidebar:
    st.header("🔗 Conectividad")
    target_url = st.text_input("URL Webhook", value="http://localhost:8000/api/v1/webhooks/receive/")
    
    st.divider()
    st.markdown("### 📊 Estado del Sistema")
    # Simulación de ping al backend
    try:
        ping = requests.get(target_url.replace("webhooks/receive/", ""), timeout=2)
        st.success(f"Backend Online (HTTP {ping.status_code})")
    except:
        st.error("Backend Offline")

# TABS
tab1, tab2, tab3 = st.tabs(["🚀 Inyección Estándar", "🧬 Laboratorio de Identidad", "🌊 Stress Hydra"])

# --- TAB 1: GENERADOR ESTÁNDAR ---
with tab1:
    col1, col2 = st.columns([1, 2])
    with col1:
        st.subheader("Configurar Lote")
        source = st.selectbox("Fuente", ["facebook", "instagram", "google", "web", "organic"], key="t1_source")
        format_type = st.radio("Formato", ["standard", "facebook", "dirty"], key="t1_format")
        count = st.slider("Cantidad", 1, 100, 10)
        
        if st.button("Ejecutar Lote", type="primary"):
            results = []
            bar = st.progress(0)
            for i in range(count):
                lead_data = generate_base_lead()
                # Ajustar formato
                if format_type == "facebook":
                    payload = {"source_type": "facebook", "data": {"nombre": lead_data["first_name"], "email": lead_data["email"], "tel": lead_data["phone"]}}
                elif format_type == "dirty":
                    payload = {"first_name": lead_data["first_name"], "emial": lead_data["email"]} # Error typo
                else:
                    payload = {"source_type": source, "data": lead_data}
                
                sc, text, lat = send_webhook(target_url, payload)
                results.append({"Status": sc, "Latency": lat, "Lead": lead_data["email"]})
                bar.progress((i+1)/count)
            
            st.table(pd.DataFrame(results).head(10))

    with col2:
        st.info("💡 Usa la Inyección Estándar para poblar el dashboard rápidamente con datos limpios.")
        st.image("https://img.icons8.com/fluency/96/database.png", width=60)

# --- TAB 2: LABORATORIO DE IDENTIDAD (DOUBLE ANCHOR) ---
with tab2:
    st.subheader("🧬 Test de Resolución de Identidad")
    st.markdown("""
    Este módulo pone a prueba el algoritmo **Double Anchor**. 
    El sistema debe ser capaz de reconocer si un lead es el mismo basándose en Email O Teléfono.
    """)
    
    if 'id_lab_lead' not in st.session_state:
        st.session_state.id_lab_lead = generate_base_lead()

    c1, c2, c3 = st.columns(3)
    
    with c1:
        st.write("**Paso 1: Crear Lead Original**")
        st.json(st.session_state.id_lab_lead)
        if st.button("Inyectar Original"):
            sc, text, lat = send_webhook(target_url, {"source_type": "lab", "data": st.session_state.id_lab_lead})
            st.toast(f"Enviado! Status: {sc}")

    with c2:
        st.write("**Paso 2: Mismo Email, Nuevo Teléfono**")
        new_phone_lead = st.session_state.id_lab_lead.copy()
        new_phone_lead["phone"] = f"+569{random.randint(11111111, 99999999)}"
        new_phone_lead["last_name"] = "(Updated Phone)"
        st.json(new_phone_lead)
        if st.button("Inyectar Cambio Tel"):
            sc, text, lat = send_webhook(target_url, {"source_type": "lab", "data": new_phone_lead})
            st.toast(f"Enviado! Status: {sc}")

    with c3:
        st.write("**Paso 3: Mismo Teléfono, Nuevo Email**")
        new_email_lead = st.session_state.id_lab_lead.copy()
        new_email_lead["email"] = f"new_identity_{random.randint(1,999)}@test.com"
        new_email_lead["last_name"] = "(Updated Email)"
        st.json(new_email_lead)
        if st.button("Inyectar Cambio Email"):
            sc, text, lat = send_webhook(target_url, {"source_type": "lab", "data": new_email_lead})
            st.toast(f"Enviado! Status: {sc}")

    st.divider()
    st.write("**⚠️ Test de Estrés: Colisión de Identidad**")
    st.markdown("Envía 2 peticiones **exactamente iguales** al mismo tiempo para ver si el sistema genera duplicados o maneja la carrera correctamente.")
    if st.button("💥 Probar Colisión (2 envíos simultáneos)"):
        collision_lead = generate_base_lead()
        payload = {"source_type": "collision_test", "data": collision_lead}
        
        st.write("Enviando duplicados para:", collision_lead["email"])
        
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(send_webhook, target_url, payload) for _ in range(2)]
            for future in concurrent.futures.as_completed(futures):
                results.append(future.result())
        
        for i, (sc, text, lat) in enumerate(results):
            st.write(f"Envío {i+1}: Status {sc} | Latencia {lat:.3f}s")
            
        st.info("Revisa el Dashboard: Solo debería existir 1 Lead para este correo, pero 2 Interacciones en su ficha.")

    if st.button("🔄 Generar Nueva Identidad de Prueba"):
        st.session_state.id_lab_lead = generate_base_lead()
        st.rerun()

# --- TAB 3: STRESS HYDRA (CONCURRENCY) ---
with tab3:
    st.subheader("🌊 Stress Hydra: Test de Concurrencia Extrema")
    col_a, col_b = st.columns([1, 1])
    
    with col_a:
        threads = st.number_input("Hilos concurrentes", 1, 50, 10)
        total_reqs = st.number_input("Total de peticiones", 10, 500, 50)
        
        if st.button("🔥 SOLTAR LA HYDRA", type="primary"):
            st.warning(f"Iniciando ataque de {total_reqs} peticiones con {threads} hilos...")
            
            all_leads = [generate_base_lead() for _ in range(total_reqs)]
            payloads = [{"source_type": "stress", "data": l} for l in all_leads]
            
            results = []
            start_test = time.time()
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=threads) as executor:
                future_to_url = {executor.submit(send_webhook, target_url, p): p for p in payloads}
                for future in concurrent.futures.as_completed(future_to_url):
                    sc, text, lat = future.result()
                    results.append({"status": sc, "latency": lat})
            
            total_time = time.time() - start_test
            df_res = pd.DataFrame(results)
            
            st.success(f"Test completado en {total_time:.2f} segundos.")
            
            # Métricas
            m1, m2, m3 = st.columns(3)
            m1.metric("Éxito (200 OK)", len(df_res[df_res['status'] == 200]))
            m2.metric("Latencia Media", f"{df_res['latency'].mean():.3f}s")
            m3.metric("Peticiones/Seg", f"{len(df_res)/total_time:.1f}")
            
            st.line_chart(df_res['latency'])

    with col_b:
        st.info("""
        **¿Qué buscar en este test?**
        1. **Deadlocks**: Si el backend usa `select_for_update`, este test verificará que las transacciones no se bloqueen entre sí.
        2. **Race Conditions**: ¿Los leads se asignan correlativamente o hay saltos extraños?
        3. **Estabilidad**: ¿El servidor empieza a devolver 500 o 504 bajo carga?
        """)
        st.warning("⚠️ Monitorea los logs de Django mientras corres este test.")

st.divider()
st.caption(f"Lead Forge Pro v2.0 | {datetime.now().strftime('%Y-%m-%d %H:%M')}")
