import psycopg2
import os
import dotenv
import pandas as pd

# Load environment variables
dotenv.load_dotenv(r"c:\Users\EQUIPO\Desktop\Sandbox\devPythonActual\pt.cl-vitacura\.env.local")

host = os.getenv("POSTGRES_HOST")
database = os.getenv("POSTGRES_DATABASE", "db_casos")
user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
port = os.getenv("POSTGRES_PORT", "5432")

excel_path = r"c:\Users\EQUIPO\Desktop\Sandbox\devPythonActual\pt.cl-vitacura\prestaciones.xlsx"

try:
    print("Connecting to PostgreSQL...")
    conn = psycopg2.connect(host=host, database=database, user=user, password=password, port=port)
    cur = conn.cursor()
    
    print("Reading Excel file...")
    df = pd.read_excel(excel_path)
    
    # Filter only enabled (habilitado == 1) and valid aranceles (0: Base, 6: Preferencial)
    filtered_df = df[(df['habilitado'] == 1) & (df['id_arancel'].isin([0, 6]))]
    print(f"Filtered {len(filtered_df)} rows from Excel.")
    
    # Clear the existing arancel table in db_casos
    print("Clearing 'arancel' table...")
    cur.execute("DELETE FROM arancel")
    
    print("Inserting enabled aranceles into the database...")
    inserted_count = 0
    for idx, row in filtered_df.iterrows():
        id_prestacion = int(row['id'])
        name = str(row['nombre']).strip()
        category = str(row['nombre_categoria']).strip()
        id_arancel = int(row['id_arancel'])
        price = int(row['precio']) if not pd.isna(row['precio']) else None
        
        price_base = price if id_arancel == 0 else None
        price_pref = price if id_arancel == 6 else None
        
        cur.execute("""
            INSERT INTO arancel (id, name, category, source, price_base, price_pref, show_in_odontogram, id_prestacion, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                price_base = COALESCE(EXCLUDED.price_base, arancel.price_base),
                price_pref = COALESCE(EXCLUDED.price_pref, arancel.price_pref),
                id_prestacion = EXCLUDED.id_prestacion,
                updated_at = NOW()
        """, (id_prestacion, name, category, 'dentalink', price_base, price_pref, True, id_prestacion))
        inserted_count += 1
        
    conn.commit()
    print(f"Successfully synced {inserted_count} arancel items to the database!")
    
    # Write audit log entry
    try:
        import json
        print("Writing audit log entry...")
        details_json = json.dumps({
            "count": inserted_count,
            "source": "excel_file",
            "file": excel_path
        })
        cur.execute("""
            INSERT INTO audit_logs (action, user_name, user_email, ip_address, details)
            VALUES (%s, %s, %s, %s, %s)
        """, ('ARANCELES_SYNCED', 'Sistema (Script Sincronización)', 'system@dentalink.sync', '127.0.0.1', details_json))
        conn.commit()
        print("Audit log entry successfully written.")
    except Exception as audit_err:
        print(f"Warning: Failed to write audit log: {audit_err}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error during synchronization: {e}")
