@echo off
TITLE Lead Flow CRM - Launcher
echo ========================================
echo   🚀 Iniciando Lead Flow CRM (Nativo)
echo ========================================

:: 1. Iniciar Backend
echo [1/3] Iniciando Backend en puerto 8000...
start "Lead Flow - BACKEND" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

:: 2. Iniciar Worker (Tareas en segundo plano)
echo [2/3] Iniciando Worker para tareas en segundo plano...
start "Lead Flow - WORKER" cmd /k "cd backend && venv\Scripts\activate && python manage.py qcluster"

:: 3. Iniciar Frontend
echo [3/3] Iniciando Frontend en puerto 3000...
start "Lead Flow - FRONTEND" cmd /k "cd frontend && npm run dev"

echo.
echo ✨ ¡Todo listo! 
echo El CRM estara disponible en: http://localhost:3000
echo La API estara disponible en: http://localhost:8000/api/v1
echo.
pause
