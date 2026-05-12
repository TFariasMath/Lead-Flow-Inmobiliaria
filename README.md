# Lead Flow

**Lead Flow** es una plataforma diseñada para la gestión de inversiones inmobiliarias a gran escala. Es una suite completa de ingeniería de datos que centraliza la captura, resolución de identidad y distribución de prospectos comerciales desde múltiples canales digitales.

---

## 🏛️ Arquitectura del Sistema

El sistema sigue una arquitectura de servicios desacoplados diseñada para la resiliencia y el alto rendimiento:

### 1. Backend (Django REST Framework)
- **Engine**: Python 3.11 + Django 4.2.
- **Base de Datos**: PostgreSQL 15, optimizado con bloqueos transaccionales (`FOR UPDATE`).
- **Procesamiento Asíncrono**: Django Q. Las tareas pesadas (ingesta de webhooks, generación de PDFs, envío de correos) no bloquean el flujo principal.
- **Auditoría**: `django-simple-history` para trazabilidad total de cambios en los modelos `Lead` y `Property`.

### 2. Frontend (Next.js 14 Performance Edition)
- **App Router**: Renderizado híbrido (SSR/CSR) para máxima velocidad.
- **Virtualized Grid**: Uso de `@tanstack/react-virtual` para renderizar miles de leads con un consumo de memoria mínimo (60 FPS scroll).
- **Kanban Engine**: Gestión visual del pipeline comercial con estados dinámicos.
- **Data Hydration**: SWR para sincronización de datos en tiempo real sin recargas de página.

### 3. Resilience Node (Lead Forge Pro)
- **Audit Tool**: Una aplicación independiente en **Streamlit** que actúa como "Chaos Monkey" y generador de carga para certificar la estabilidad del backend ante picos de tráfico.

---

## 🧬 Soluciones a Problemas Complejos

### 1. El Dilema de la Identidad (Double Anchor System)
**Problema**: Un cliente entra por Facebook. Luego el vendedor cambia su correo a uno "corporativo". Mañana el cliente vuelve a entrar por una landing usando su correo personal. ¿Cómo evitar el duplicado?
**Solución**: Implementamos un sistema de **Doble Ancla**. 
- `original_email`: Capturado en el primer contacto, es **inmutable**. Se usa como clave primaria lógica de identidad.
- `contact_email`: Editable para fines comerciales.
El sistema busca coincidencias en AMBOS campos antes de decidir si crea un nuevo lead o actualiza uno existente.

### 2. Webhook Racing (Race Conditions)
**Problema**: Dos servicios externos mandan datos del mismo lead al mismo milisegundo. Dos procesos de Django intentan crear el lead simultáneamente, resultando en duplicados o errores de integridad.
**Solución**: 
- **Row-Level Locking**: Usamos `select_for_update()` dentro de un `transaction.atomic()`. El primer proceso que llega bloquea la búsqueda del lead; el segundo debe esperar a que el primero termine.
- **Integrity Fallback**: Si el bloqueo falla por milisegundos, el constraint `UNIQUE` de PostgreSQL dispara un error que capturamos para redirigir el flujo a una actualización limpia.

### 3. Ingesta Tolerante a Fallos (Modo Quirófano)
**Problema**: Un servicio externo cambia su formato JSON sin avisar y los webhooks empiezan a fallar.
**Solución**: Cada petición se guarda en un `WebhookLog` en estado `PENDING`. Si el procesador falla, el log queda como `FAILED`. Un administrador puede entrar al dashboard, **editar el JSON crudo directamente** y ejecutar el botón "Reprocess" para recuperar el lead sin que el cliente sepa que hubo un error técnico.

---

## 🚀 Funcionalidades Elite

### 📧 Automatización y Scoring
- **Dynamic Scoring**: Cada lead recibe un puntaje (0-100) basado en la completitud de su perfil (Teléfono: 40pts, Email: 30pts, etc.).
- **Nurturing Automático**: Si un lead es "Hot" (Score > 70), el sistema dispara inmediatamente una tarea asíncrona para enviar un **Welcome Email** personalizado.
- **Alertas Proactivas**: El sistema detecta leads "Estancados" (sin cambios en 24h) y lanza alertas visuales en el dashboard.

### 📄 Generación de Catálogos (Brochure Engine)
- **PDF Dinámico**: El sistema toma los datos del lead, la campaña y las propiedades vinculadas para generar un **Brochure PDF de alta calidad** usando `xhtml2pdf`.
- **Mapas Estáticos**: Integración con Mapbox API para inyectar mapas de ubicación exactos en los documentos PDF generados.

### 🔄 Distribución Equitativa (Round Robin)
- El sistema mantiene un estado global (`RoundRobinState`) para asegurar que cada nuevo lead se asigne secuencialmente al siguiente vendedor disponible, evitando favoritismos y asegurando una respuesta rápida.

---

## 🎮 Módulos y Experiencia de Usuario

### 🔐 Autenticación y Seguridad (Acceso al Nodo)

El acceso al sistema está blindado mediante una interfaz de **"Terminal de Nodo"**, diseñada para proyectar seguridad y control desde el primer contacto.

![Acceso al Nodo](./frontend/public/docs/login.png)

*   **Autenticación JWT:** Implementa un sistema de tokens asíncronos (JSON Web Tokens) para una comunicación *stateless* y segura.
*   **Control de Acceso Basado en Roles (RBAC):** El sistema identifica automáticamente si el usuario es un **Administrador de Nodo** o un **Agente de Ventas**, redirigiendo dinámicamente al dashboard correspondiente.

#### 🔑 Credenciales de Acceso (Entorno de Desarrollo)
Para fines de evaluación y pruebas en el entorno local, se han pre-configurado las siguientes llaves de acceso:

*   **Administrador Maestro:** 
    *   **Terminal ID:** `admin`
    *   **Security Key:** `123`
*   **Agentes de Ventas:** El sistema cuenta con perfiles de vendedores (`maria`, `carlos`, `ana` con clave `123`), aunque sus vistas específicas están en proceso de desarrollo.

---

### 🖥️ Dashboard Estratégico: El Poder de la Vista Única

El dashboard principal ha sido diseñado bajo una filosofía de **Control Situacional**, eliminando la fricción de la navegación tradicional para convertir los datos en decisiones instantáneas.

![Dashboard Overview](./frontend/public/docs/dashboard1.png)

#### 🚀 Filosofía "Zero Scroll" (Control Total de un Vistazo)
A diferencia de los CRM convencionales donde la información está enterrada bajo pestañas o scroll infinito, en **Lead Flow** la información no se busca, se presenta.

*   **El Concepto:** El dashboard actúa como la **cabina de un mando** o una consola de monitoreo de misión. El objetivo es mantener la "Conciencia Situacional" (*Situational Awareness*) en todo momento: si un gerente debe hacer scroll para ver si su equipo está rindiendo, ya perdiste el pulso de la operación.
*   **El Objetivo:** Reducir la carga cognitiva. El cerebro procesa patrones y métricas mucho más rápido cuando el layout es estático, predecible y está contenido dentro del campo visual del usuario.

#### 🎴 Arquitectura de Capas Dinámicas (Slides)
Para mantener esta limpieza visual sin sacrificar profundidad, la información se organiza en **capas de información intercambiables** que el usuario puede invocar desde la consola de navegación:

1.  **Capa de Tráfico (Traffic Node):** Despliega un análisis exhaustivo del pulso digital del negocio. Permite visualizar picos de interés, rendimiento por landing page y volumen de visitas en series temporales de alta fidelidad.
2.  **Capa de Pipeline (Conversion Node):** Transforma el inventario de leads en un flujo visual. Aquí se monitorea el **Flujo de Conversión** y el estatus de maduración de los prospectos, permitiendo identificar cuellos de botella en tiempo real.
3.  **Capa de Equipo (Performance Node):** Es el centro de mando del capital humano. Permite ver el rendimiento individual, gestionar el estado del **Round Robin** y alternar la disponibilidad de los agentes con un solo clic.
4.  **Capa de Historial (Audit Node):** El "Diario de Vuelo" del sistema. Registra cronológicamente cada interacción, cambio de estado y resolución de identidad, garantizando una trazabilidad total "quirúrgica".

![Dashboard Detalle](./frontend/public/docs/dashboard2.png)

---

### 🔄 Reparto Inteligente (Round Robin Pro)

El sistema de distribución de leads es el corazón operativo de **Lead Flow**. Utiliza un algoritmo de **Round Robin Determinista** que garantiza un reparto equitativo y transparente entre el equipo de ventas.

![Round Robin Management](./frontend/public/docs/round_robin.png)

#### Mecanismo de Funcionamiento:
1.  **Algoritmo de Rotación:** El sistema mantiene un puntero global (`RoundRobinState`) que apunta al último vendedor que recibió un lead. El siguiente prospecto se asigna automáticamente al siguiente vendedor en la lista circular.
2.  **Gestión de Disponibilidad en Tiempo Real:** 
    *   Los administradores pueden activar o desactivar vendedores del flujo de reparto con un solo clic (botón de "Rayito").
    *   Si un vendedor está en modo **"OUT"** (Pausado), el sistema lo salta automáticamente y busca al siguiente disponible, asegurando que ningún lead quede sin atención.
3.  **Visibilidad Total (Next in Line):**
    *   **Badge "SIGUIENTE":** Identifica visualmente al vendedor que recibirá el próximo lead entrante, permitiendo al equipo prepararse para la acción.
    *   **Badge "OUT":** Indica claramente quién está fuera de la rotación actual, permitiendo una gestión de turnos eficiente.
4.  **Sincronización de Datos:** Cada cambio en la disponibilidad del equipo se refleja instantáneamente en el dashboard mediante un sistema de hidratación de datos optimizado, garantizando que el "Siguiente en línea" sea siempre preciso.


---

## 🛠️ Guía de Instalación y Despliegue

### Requisitos Previos
- Python 3.10+
- Node.js 18+
- PostgreSQL 15

### Configuración Rápida (Enterprise Suite)

#### 🪟 Windows (PowerShell)
```powershell
# 1. Instalación Profesional
.\scripts\setup_enterprise.ps1

# 2. Iniciar Ecosistema
.\run_crm.bat
```

#### 🐧 Linux / macOS (Bash)
```bash
# 1. Instalación Profesional
bash scripts/setup_linux.sh

# 2. Iniciar Ecosistema
bash run_linux.sh
```

### Gestión y Diagnóstico
- **Chequeo de DB (Win)**: `.\backend\venv\Scripts\python.exe scripts\check_db.py`
- **Chequeo de DB (Linux)**: `./backend/venv/bin/python scripts/check_db.py`
- **Tests (Win)**: `.\backend\venv\Scripts\python.exe backend\manage.py test leads.tests_webhooks`
- **Tests (Linux)**: `./backend/venv/bin/python backend/manage.py test leads.tests_webhooks`

---

## 📂 Estructura del Proyecto

- `/backend`: Core Django, API REST, Services (Webhooks, Distribution).
- `/frontend`: Next.js UI, Kanban, Virtualized Grid, Dashboards.
- `/tools`: Lead Forge Pro (Streamlit).
- `/scripts`: Automatización de base de datos y scripts de stress test.

---
**Lead Flow Engineering** &copy; 2026 - *The Future of Real Estate Data Management*
