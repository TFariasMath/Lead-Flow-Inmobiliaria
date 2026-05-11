# Lead Flow

Lead Flow es una plataforma robusta de inversión inmobiliaria (CRM) diseñada para centralizar contactos (leads) desde diversas fuentes, garantizando la resolución de identidad y evitando la duplicación de datos incluso bajo condiciones de concurrencia extremas (Webhook Racing).

## Arquitectura del Proyecto

El proyecto está dividido en un backend sólido con **Django** y **PostgreSQL**, y un frontend dinámico e interactivo con **Next.js 14**.

### Stack Tecnológico
- **Backend**: Python 3.11, Django 4.2, Django REST Framework (DRF)
- **Base de Datos**: PostgreSQL 15 (vía Docker)
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Estilos & UI**: Tailwind CSS, shadcn/ui, Recharts
- **Formularios**: Formik + Yup
- **Autenticación**: JSON Web Tokens (JWT)
- **Auditoría**: django-simple-history

### Decisiones de Diseño

1. **Resolución de Identidad y Dilema del Correo**
   Para evitar problemas cuando un vendedor edita el correo de un cliente y posteriormente llega un nuevo webhook con el correo antiguo, la identidad del lead se dividió en dos campos:
   - `original_email`: Inmutable. Se utiliza de forma estricta a nivel del sistema para hacer _match_ de webhooks entrantes y agrupar el historial.
   - `contact_email`: Editable por el vendedor. Es el correo real que se utilizará para la comunicación.

2. **Webhook Racing (Concurrencia)**
   Para evitar que dos webhooks simultáneos del mismo contacto creen dos leads duplicados, se implementó una estrategia doble:
   - **Row-Level Locking**: En la capa de servicio de Django (`WebhookProcessor`), se utiliza `select_for_update()` de PostgreSQL dentro de una transacción atómica. Esto asegura que los hilos concurrentes esperen su turno ordenadamente sin lanzar errores.
   - **Database Constraint**: Como red de seguridad final, la columna `original_email` tiene un `UNIQUE CONSTRAINT`. En caso extremo de IntegrityError, el sistema lo captura limpiamente y hace un fallback a la actualización.

3. **Autenticación y Row-Level Security**
   El sistema restringe la visibilidad de los datos. Un usuario "Vendedor" (staff=False) solo puede consultar y modificar a través de la API los leads que le han sido explícitamente asignados (`assigned_to`). Los usuarios Administradores ven todo el sistema.

4. **Gestión de Webhooks Fallidos**
   El endpoint público de recepción (`/api/v1/webhooks/receive/`) está diseñado para no fallar hacia afuera. Guarda el payload en crudo en un `WebhookLog` y responde `200 OK` inmediatamente. Si el formato era inválido o faltaban datos, se marca internamente como `Failed`. Los vendedores pueden editar el JSON desde el Dashboard y re-procesarlo.

---

## Guía de Instalación Rápida (Nativa - Sin Docker)

Esta guía te permite configurar el sistema completo en pocos minutos sin necesidad de contenedores. Asegúrate de tener instalado **PostgreSQL**, **Node.js (v18+)** y **Python (v3.10+)**.

### 1. Configuración Automática
Ejecuta el script de configuración desde una terminal de **PowerShell** (en Windows):
```powershell
.\scripts\setup_local.ps1
```
Este script creará el entorno virtual, instalará todas las dependencias de Python y Node, y preparará la base de datos local por ti.

### 2. Iniciar el Sistema
Para arrancar el Backend y el Frontend simultáneamente, simplemente ejecuta:
```bash
.\run_crm.bat
```
Esto abrirá dos ventanas:
- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`

> **Credenciales por defecto:**
> - Usuario: `admin`
> - Contraseña: `admin123`

---

## Instalación Manual (Paso a Paso)

Si prefieres configurar cada parte por separado:

### 1. Backend (Django)
1. Entra en `backend/`, crea un `venv` e instala `requirements.txt`.
2. Asegúrate de tener una base de datos PostgreSQL llamada `leadflow`.
3. Configura tu `.env` (puedes usar `DB_NAME=leadflow`, `DB_USER=...`, etc).
4. Ejecuta `python manage.py migrate`.
5. Inicia con `python manage.py runserver`.

### 2. Frontend (Next.js)
1. Entra en `frontend/` y ejecuta `npm install`.
2. Crea un `.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`.
3. Inicia con `npm run dev`.

---

## Pruebas y Verificación

### Prueba de Webhooks Simples
Para simular que un servicio como Calendly o Mailchimp te envía un contacto, ejecuta:
```bash
curl -X POST http://localhost:8000/api/v1/webhooks/receive/ \
  -H "Content-Type: application/json" \
  -d '{"source_type": "web", "data": {"email": "test@ejemplo.com", "first_name": "Pedro", "phone": "555-1234"}}'
```

### Prueba de Condiciones de Carrera (Webhook Racing)
En la raíz del proyecto, dentro de la carpeta `scripts/`, encontrarás `test_racing.py`. Este script levanta 10 hilos simultáneos disparando el mismo payload al mismo milisegundo:
```bash
cd scripts
..\backend\venv\Scripts\python.exe test_racing.py
```
Revisa tu Dashboard y notarás que **solo se creó 1 Lead**, pero este posee **10 interacciones** en su historial, demostrando la eficacia del bloqueo transaccional en PostgreSQL.
