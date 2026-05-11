import sys
import psycopg2
from psycopg2 import OperationalError

def check_db_connection():
    print("🔍 Diagnosticando conexión a PostgreSQL...")
    
    # Intentar leer desde .env si existe (simulación simplificada)
    db_params = {
        "dbname": "leadflow",
        "user": "leadflow_user",
        "password": "leadflow_secret_2024",
        "host": "localhost",
        "port": "5432"
    }
    
    try:
        conn = psycopg2.connect(**db_params)
        print("✅ Conexión exitosa a la base de datos 'leadflow'.")
        conn.close()
        return True
    except OperationalError as e:
        print(f"❌ Error de conexión: {e}")
        print("\nSugerencias:")
        print("1. Verifica que PostgreSQL esté instalado y corriendo.")
        print("2. Asegúrate de que el usuario 'leadflow_user' tenga permisos.")
        print("3. Si la DB no existe, ejecute: CREATE DATABASE leadflow;")
        return False

if __name__ == "__main__":
    success = check_db_connection()
    sys.exit(0 if success else 1)
