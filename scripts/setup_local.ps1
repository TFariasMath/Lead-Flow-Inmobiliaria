# Lead Flow - Script de Configuración Local (Sin Docker)
# ===================================================

Write-Host "🚀 Iniciando configuración de entorno Lead Flow..." -ForegroundColor Cyan

# 1. Verificación de Prerrequisitos
Write-Host "`n🔍 Verificando herramientas instaladas..." -ForegroundColor Yellow

$python = Get-Command python -ErrorAction SilentlyContinue
if (!$python) { 
    Write-Error "❌ Python no encontrado. Por favor instálalo desde python.org"
    exit
} else { Write-Host "✅ Python detectado." }

$node = Get-Command node -ErrorAction SilentlyContinue
if (!$node) { 
    Write-Error "❌ Node.js no encontrado. Por favor instálalo desde nodejs.org"
    exit
} else { Write-Host "✅ Node.js detectado." }

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (!$psql) { 
    Write-Warning "⚠️ PostgreSQL (psql) no detectado en el PATH. Asegúrate de tenerlo instalado y configurado."
} else { 
    Write-Host "✅ PostgreSQL detectado."
}

# 2. Configuración del Backend
Write-Host "`n🐍 Configurando Backend (Django)..." -ForegroundColor Yellow
cd backend

if (!(Test-Path "venv")) {
    Write-Host "📦 Creando entorno virtual..."
    python -m venv venv
}

Write-Host "⬇️ Instalando dependencias de Python..."
.\venv\Scripts\pip.exe install -r requirements.txt

Write-Host "🎭 Instalando navegadores para Playwright (necesario para PDFs)..."
.\venv\Scripts\playwright.exe install chromium

# Crear .env si no existe
if (!(Test-Path ".env")) {
    Write-Host "📝 Creando archivo .env por defecto..."
    "DB_NAME=leadflow`nDB_USER=leadflow_user`nDB_PASSWORD=leadflow_secret_2024`nDB_HOST=localhost`nDB_PORT=5432" | Out-File -FilePath .env -Encoding utf8
}

Write-Host "🗄️ Ejecutando migraciones de base de datos..."
.\venv\Scripts\python.exe manage.py migrate

cd ..

# 3. Configuración del Frontend
Write-Host "`n⚛️ Configurando Frontend (Next.js)..." -ForegroundColor Yellow
cd frontend

Write-Host "⬇️ Instalando dependencias de Node (esto puede tardar)..."
npm install

# Crear .env.local si no existe
if (!(Test-Path ".env.local")) {
    Write-Host "📝 Creando archivo .env.local..."
    "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" | Out-File -FilePath .env.local -Encoding utf8
}

cd ..

Write-Host "`n✨ ¡Configuración completada con éxito!" -ForegroundColor Green
Write-Host "Ahora puedes usar 'run_crm.bat' para iniciar el sistema." -ForegroundColor White
