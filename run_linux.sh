#!/bin/bash
# Lead Flow - Linux Execution Engine
# ==================================

echo "========================================================="
echo "     LEAD FLOW - LINUX EXECUTION ENGINE                "
echo "========================================================="

# 1. Check venv
if [ ! -d "backend/venv" ]; then
    echo "❌ Entorno no configurado. Ejecuta primero: bash scripts/setup_linux.sh"
    exit 1
fi

# 2. Cleanup
echo "🧹 Limpiando procesos previos..."
pkill -f "runserver" || true
pkill -f "next-dev" || true
pkill -f "streamlit" || true

# 3. Start Backend
echo -e "\n🚀 Iniciando Backend (Django)..."
cd backend
./venv/bin/python manage.py runserver 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 4. Wait for Backend
echo "⏳ Esperando al Backend..."
until curl -s http://localhost:8000/api/v1/webhooks/receive/ > /dev/null; do
  sleep 1
done
echo "✅ Backend Ready!"

# 5. Start Frontend
echo -e "\n🚀 Iniciando Frontend (Next.js)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 6. Start Lead Forge
echo -e "\n🚀 Iniciando Lead Forge (Streamlit)..."
./backend/venv/bin/python -m streamlit run tools/lead-generator/lead_forge.py --server.port 8501 > tools.log 2>&1 &
TOOLS_PID=$!

echo -e "\n========================================================="
echo "     SISTEMA EN EJECUCIÓN (LINUX MODE)                 "
echo "========================================================="
echo "Dashboard:   http://localhost:3000"
echo "API:         http://localhost:8000"
echo "Lead Forge:  http://localhost:8501"
echo -e "\nLogs disponibles en: backend.log, frontend.log, tools.log"
echo "Presiona Ctrl+C para detener todo."
echo "========================================================="

# Trap Ctrl+C to kill children
trap "kill $BACKEND_PID $FRONTEND_PID $TOOLS_PID; echo -e '\n🛑 Servicios detenidos.'; exit" INT

# Wait for children
wait
