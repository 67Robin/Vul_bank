import psycopg2
import os

conn = psycopg2.connect(
    host=os.getenv("DB_HOST", "127.0.0.1"),
    database=os.getenv("DB_NAME", "bank_db"),
    user=os.getenv("DB_USER", "ctf_admin"),
    port=os.getenv("DB_PORT", "5433"),
    password=os.getenv("DB_PASSWORD", "super_secret_password")
)
cursor = conn.cursor()
cursor.execute("SELECT id, sender_account_id, receiver_account_id, transfer_note FROM transactions ORDER BY id DESC LIMIT 5;")
for row in cursor.fetchall():
    print(row)
