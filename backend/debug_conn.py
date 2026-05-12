import psycopg2
import sys

def debug_conn():
    params = {
        'dbname': 'postgres',
        'user': 'leadflow_user',
        'password': 'leadflow_secret_2024',
        'host': '127.0.0.1'
    }
    
    try:
        conn = psycopg2.connect(**params)
        print("Conexion exitosa a 'postgres'")
        conn.close()
    except Exception as e:
        print("Error capturado (crudo):")
        try:
            # Intentamos ver si el error tiene un mensaje decodificable en latin-1
            # que es común en Windows en español
            raw_msg = str(e).encode('utf-8', errors='replace').decode('utf-8')
            print(f"Mensaje aproximado: {raw_msg}")
        except:
            print("No se pudo decodificar el error.")

if __name__ == "__main__":
    debug_conn()
