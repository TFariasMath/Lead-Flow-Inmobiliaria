# Lead Flow - Enterprise Setup Script (v3.0 Robust)
# ==================================================

$ErrorActionPreference = "Stop"
$StartTime = Get-Date

Clear-Host
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "     LEAD FLOW - ENTERPRISE INSTALLATION SUITE           " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Iniciando despliegue robusto del ecosistema inmobiliario...`n"

function Show-Progress($TaskName, $Step, $TotalSteps) {
    $percent = [math]::Round(($Step / $TotalSteps) * 100)
    Write-Progress -Activity "Configurando Lead Flow" -Status "$TaskName ($percent%)" -PercentComplete $percent
}

# --- STEP 1: PREREQUISITES ---
Write-Host "[1/6] Auditando prerequisitos del sistema..." -ForegroundColor Yellow
$Steps = 6
Show-Progress "Verificando herramientas" 1 $Steps

$tools = @{
    "Python" = "python --version"
    "Node.js" = "node --version"
    "npm" = "npm --version"
    "git" = "git --version"
}

foreach ($tool in $tools.Keys) {
    try {
        Invoke-Expression $tools[$tool] | Out-Null
        Write-Host "  [OK] $tool detectado." -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] $tool no encontrado. Es obligatorio para la instalación." -ForegroundColor Red
        exit
    }
}

# --- STEP 2: NETWORK CHECK ---
Show-Progress "Verificando puertos" 2 $Steps
Write-Host "`n[2/6] Verificando disponibilidad de red..." -ForegroundColor Yellow
$ports = @(8000, 3000, 8501)
foreach ($port in $ports) {
    $check = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($check) {
        Write-Host "  [WARN] El puerto $port ya está en uso por el proceso $($check.OwningProcess). Cierra la aplicación antes de continuar." -ForegroundColor Red
        # No salimos, solo advertimos
    } else {
        Write-Host "  [OK] Puerto $port disponible." -ForegroundColor Green
    }
}

# --- STEP 3: BACKEND CONFIGURATION ---
Show-Progress "Configurando Backend" 3 $Steps
Write-Host "`n[3/6] Configurando Backend (Django Core)..." -ForegroundColor Yellow

if (!(Test-Path "backend")) { Write-Error "Carpeta 'backend' no encontrada."; exit }

Push-Location backend

if (!(Test-Path "venv")) {
    Write-Host "  [VENV] Creando entorno virtual aislado..."
    python -m venv venv
}

Write-Host "  [PIP] Sincronizando dependencias de Python (Enterprise)..."
.\venv\Scripts\python.exe -m pip install --upgrade pip | Out-Null
.\venv\Scripts\pip.exe install -r requirements.txt | Out-Null

if (!(Test-Path ".env")) {
    Write-Host "  📝 Generando configuración de entorno (.env)..."
    $envContent = @"
DB_NAME=leadflow
DB_USER=leadflow_user
DB_PASSWORD=leadflow_secret_2024
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=$( [guid]::NewGuid().ToString() )
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
"@
    $envContent | Out-File -FilePath .env -Encoding utf8
}

Write-Host "  [SQL] Aplicando esquemas de base de datos..."
try {
    .\venv\Scripts\python.exe manage.py migrate
} catch {
    Write-Host "  [ERROR] Error en migraciones. Verifique PostgreSQL." -ForegroundColor Red
    Write-Host "  [TIP] Ejecute: psql -U postgres -c 'CREATE DATABASE leadflow;'" -ForegroundColor Cyan
}

Write-Host "  [AUTH] Verificando cuenta administrativa..."
# Script simple para crear superuser si no existe
$createSuperUser = @"
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@leadflow.cl', 'admin123')
    print('  [OK] Usuario admin creado (admin / admin123)')
else:
    print('  [OK] Usuario admin ya existe.')
"@
$createSuperUser | .\venv\Scripts\python.exe

Pop-Location

# --- STEP 4: FRONTEND CONFIGURATION ---
Show-Progress "Configurando Frontend" 4 $Steps
Write-Host "`n[4/6] Configurando Frontend (Next.js v14)..." -ForegroundColor Yellow

if (!(Test-Path "frontend")) { Write-Error "Carpeta 'frontend' no encontrada."; exit }

Push-Location frontend

if (!(Test-Path "node_modules")) {
    Write-Host "  [NPM] Instalando ecosistema de Node (esto puede tardar)..."
    npm install --silent
} else {
    Write-Host "  [OK] node_modules ya existente. Saltando instalacion."
}

if (!(Test-Path ".env.local")) {
    Write-Host "  [ENV] Generando .env.local..."
    "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" | Out-File -FilePath .env.local -Encoding utf8
}

Pop-Location

# --- STEP 5: TOOLS & AUDIT SUITE ---
Show-Progress "Configurando Tools" 5 $Steps
Write-Host "`n[5/6] Configurando Tools y Resilience Suite..." -ForegroundColor Yellow

# Instalamos dependencias de Lead Forge en el venv del backend para evitar duplicar venvs
Write-Host "  [PIP] Instalando dependencias de Lead Forge..."
.\backend\venv\Scripts\pip.exe install -r tools\lead-generator\requirements.txt | Out-Null

# --- STEP 6: FINAL VALIDATION ---
Show-Progress "Validación final" 6 $Steps
Write-Host "`n[6/6] Realizando validacion final..." -ForegroundColor Yellow

$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "     INSTALACION COMPLETADA EXITOSAMENTE!               " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Tiempo total: $($Duration.Minutes)m $($Duration.Seconds)s"
Write-Host "`nACCESO RÁPIDO:"
Write-Host "  - CRM Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Admin Panel:   http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host "  - Lead Forge:    http://localhost:8501" -ForegroundColor Cyan
Write-Host "`nCOMANDO PARA INICIAR:"
Write-Host "  .\run_crm.bat" -ForegroundColor White
Write-Host "=========================================================`n"

Remove-Item -Path "backend\.env.tmp" -ErrorAction SilentlyContinue
