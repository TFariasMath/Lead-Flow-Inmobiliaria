# Lead Flow - Enterprise Execution Engine
# ======================================

$ErrorActionPreference = "Continue"

Clear-Host
Write-Host "=========================================================" -ForegroundColor Blue
Write-Host "     LEAD FLOW - ENTERPRISE EXECUTION ENGINE             " -ForegroundColor Blue
Write-Host "=========================================================" -ForegroundColor Blue

# 1. Verificar si el entorno está configurado
if (!(Test-Path "backend\venv")) {
    Write-Host "[ERROR] Entorno no configurado. Ejecuta primero .\scripts\setup_enterprise.ps1" -ForegroundColor Red
    exit
}

# 2. Matar procesos previos para evitar conflictos de puerto
Write-Host "Limpiando procesos previos..." -ForegroundColor Gray
$processes = @("python", "node")
foreach ($p in $processes) {
    Get-Process -Name $p -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Tarea Inversion Inmobiliaria*" } | Stop-Process -Force
}

# 3. Iniciar Backend (Django)
Write-Host ""
Write-Host "[START] Iniciando Backend (Django) en el puerto 8000..." -ForegroundColor Green
Start-Process -FilePath "backend\venv\Scripts\python.exe" -ArgumentList "manage.py runserver 8000" -WorkingDirectory "backend" -WindowStyle Minimized

# 4. Esperar a que el Backend esté listo
Write-Host "Esperando a que el Backend responda..." -ForegroundColor Yellow
$retries = 0
$backendReady = $false
while ($retries -lt 10 -and !$backendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health/" -Method Get -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $backendReady = $true }
    } catch {
        $retries++
        Start-Sleep -Seconds 2
    }
}

if ($backendReady) {
    Write-Host "[OK] Backend Ready!" -ForegroundColor Green
} else {
    Write-Host "[WARN] El Backend tarda en responder, iniciando Frontend de todas formas..." -ForegroundColor Yellow
}

# 5. Iniciar Frontend (Next.js)
Write-Host ""
Write-Host "[START] Iniciando Frontend (Next.js) en el puerto 3000..." -ForegroundColor Green
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "frontend" -WindowStyle Minimized

# 6. Iniciar Lead Forge (Streamlit)
Write-Host ""
Write-Host "[START] Iniciando Lead Forge (Auditoria) en el puerto 8501..." -ForegroundColor Green
Start-Process -FilePath "backend\venv\Scripts\python.exe" -ArgumentList "-m streamlit run tools\lead-generator\lead_forge.py --server.port 8501" -WindowStyle Minimized

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "     TODO EL ECOSISTEMA ESTÁ EN EJECUCIÓN                " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Leads CRM:   http://localhost:3000"
Write-Host "API Swagger: http://localhost:8000/api/v1/docs/"
Write-Host "Lead Forge:  http://localhost:8501"
Write-Host "`nNota: Las consolas están minimizadas en tu barra de tareas."
Write-Host "Presiona cualquier tecla para cerrar este monitor y detener todo."
Write-Host "========================================================="

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Limpieza al salir
Write-Host ""
Write-Host "[STOP] Deteniendo servicios..." -ForegroundColor Red
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Tarea Inversion Inmobiliaria*" } | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next-dev*" } | Stop-Process -Force
Write-Host "Limpieza completada."
