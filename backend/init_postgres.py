import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

def init_db():
    # Datos del .env (hardcoded para este paso de emergencia)
    db_name = "leadflow"
    db_user = "leadflow_user"
    db_pass = "leadflow_secret_2024"
    db_host = "127.0.0.1"
    
    try:
        # 1. Intentar conectar a la base de datos por defecto 'postgres'
        print(f"Intentando conectar a 'postgres' para crear '{db_name}'...")
        conn = psycopg2.connect(
            dbname='postgres', 
            user=db_user, 
            password=db_pass, 
            host=db_host
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # 2. Crear la base de datos
        cur.execute(f"CREATE DATABASE {db_name}")
        print(f"¡Base de datos '{db_name}' creada exitosamente!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Aviso/Error: {str(e)}")
        print("Si el error dice 'already exists', todo está bien.")

if __name__ == "__main__":
    init_db()
