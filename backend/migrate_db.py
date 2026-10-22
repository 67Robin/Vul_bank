# migrate_db.py
import psycopg2
import os

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"), 
        database=os.getenv("DB_NAME", "bank_db"),
        user=os.getenv("DB_USER", "ctf_admin"),
        port=os.getenv("DB_PORT", "5433"),
        password=os.getenv("DB_PASSWORD", "super_secret_password")
    )

def run_migrations():
    print("Connecting to database to run migrations...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Add the Taint Tracker column
        print("Adding 'active_exploit_taint' column to users table...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS active_exploit_taint VARCHAR(50) DEFAULT NULL;
        """)

        # 2. Ensure timestamp columns exist for game mechanics (cooldowns & shields)
        print("Ensuring timestamp columns exist...")
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_attack_timestamp TIMESTAMP DEFAULT NULL;
        """)
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS immunity_expires_at TIMESTAMP DEFAULT NULL;
        """)

        # 3. Ensure captured_flags table exists and has the correct structure
        print("Verifying captured_flags table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS captured_flags (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                flag_type VARCHAR(50),
                points_awarded INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            ALTER TABLE captured_flags 
            ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) DEFAULT NULL;
        """)

        cursor.execute("ALTER TABLE users ALTER COLUMN nickname TYPE TEXT;")
        cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transfer_note TEXT;")

        conn.commit()
        print("✅ Database migration completed successfully. Schema is ready.")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migrations()