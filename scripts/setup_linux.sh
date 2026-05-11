#!/bin/bash
# Lead Flow - Linux Enterprise Setup Script (v3.0 Robust)
# ======================================================

set -e # Exit on error
START_TIME=$(date +%s)

echo "========================================================="
echo "     LEAD FLOW - LINUX INSTALLATION SUITE              "
echo "========================================================="
echo "Iniciando despliegue robusto en entorno Unix-like..."

# --- STEP 1: PREREQUISITES ---
echo -e "\n[1/6] 🔍 Auditando prerequisitos del sistema..."
tools=("python3" "node" "npm" "git")
for tool in "${tools[@]}"; do
    if ! command -v $tool &> /dev/null; then
        echo "  ❌ $tool no encontrado. Por favor instálalo."
        exit 1
    else
        echo "  ✅ $tool detectado."
    fi
done

# --- STEP 2: NETWORK CHECK ---
echo -e "\n[2/6] 🌐 Verificando disponibilidad de red..."
ports=(8000 3000 8501)
for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "  ⚠️ Puerto $port ocupado. Cierra el proceso antes de continuar."
    else
        echo "  ✅ Puerto $port disponible."
    fi
done

# --- STEP 3: BACKEND CONFIGURATION ---
echo -e "\n[3/6] 🐍 Configurando Backend (Django Core)..."
cd backend

if [ ! -d "venv" ]; then
    echo "  📦 Creando entorno virtual..."
    python3 -m venv venv
fi

echo "  ⬇️ Sincronizando dependencias de Python..."
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "  📝 Generando configuración de entorno (.env)..."
    cat <<EOF > .env
DB_NAME=leadflow
DB_USER=leadflow_user
DB_PASSWORD=leadflow_secret_2024
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
EOF
fi

echo "  🗄️ Aplicando esquemas de base de datos..."
./venv/bin/python manage.py migrate

echo "  👤 Verificando cuenta administrativa..."
cat <<EOF | ./venv/bin/python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@leadflow.cl', 'admin123')
    print('  ✅ Usuario admin creado (admin / admin123)')
else:
    print('  ✅ Usuario admin ya existe.')
EOF

cd ..

# --- STEP 4: FRONTEND CONFIGURATION ---
echo -e "\n[4/6] ⚛️ Configurando Frontend (Next.js)..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "  ⬇️ Instalando dependencias de Node..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo "  📝 Generando .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
fi
cd ..

# --- STEP 5: TOOLS ---
echo -e "\n[5/6] 🛡️ Configurando Tools..."
./backend/venv/bin/pip install -r tools/lead-generator/requirements.txt

# --- STEP 6: FINAL ---
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n========================================================="
echo "     ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!               "
echo "========================================================="
echo "Tiempo total: ${DURATION}s"
echo -e "\nCOMANDO PARA INICIAR:"
echo "  bash run_linux.sh"
echo "========================================================="
