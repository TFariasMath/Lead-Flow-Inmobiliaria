import os
import sys
import importlib
from django.test import TestCase
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from decouple import config

class PortabilitySmokeTests(TestCase):
    """
    Test de humo para verificar la portabilidad del sistema.
    Asegura que todas las dependencias y configuraciones estén listas
    para ser instaladas en un computador nuevo.
    """

    def test_backend_dependencies_integrity(self):
        """1. Verificar que los paquetes críticos de requirements.txt se pueden importar."""
        critical_packages = [
            "rest_framework",
            "corsheaders",
            "django_filters",
            "simple_history",
            "django_q",
            "rest_framework_simplejwt",
            "decouple",
            "requests",
            "psycopg2",
        ]
        
        for package in critical_packages:
            with self.subTest(package=package):
                try:
                    importlib.import_module(package)
                except ImportError:
                    self.fail(f"Falta la dependencia: {package}. Verifique requirements.txt.")

    def test_environment_variables_loading(self):
        """2. Verificar que el sistema puede leer variables de entorno (Decouple)."""
        # Intentamos leer una variable obligatoria (o su fallback)
        try:
            secret_key = config("DJANGO_SECRET_KEY", default=None)
            self.assertIsNotNone(secret_key, "DJANGO_SECRET_KEY no detectada en .env o entorno.")
        except Exception as e:
            self.fail(f"Error cargando variables de entorno: {e}")

    def test_database_connection(self):
        """3. Verificar que la conexión a la BD es válida."""
        db_conn = connections['default']
        try:
            db_conn.cursor()
        except OperationalError:
            self.fail("No se pudo conectar a la base de datos. Verifique DB_NAME, DB_USER, etc. en .env.")

    def test_frontend_essential_files_presence(self):
        """4. Verificar que los archivos raíz del frontend existen."""
        frontend_root = os.path.join(settings.BASE_DIR, "..", "frontend")
        essential_files = ["package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs"]
        
        for f in essential_files:
            path = os.path.abspath(os.path.join(frontend_root, f))
            with self.subTest(file=f):
                self.assertTrue(os.path.exists(path), f"Falta archivo crítico de frontend: {f}")
