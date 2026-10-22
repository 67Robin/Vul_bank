import psycopg2
import hashlib

def seed_db():
    print("Connecting to the database...")
    import os
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=os.getenv("DB_PORT", "5433"),
        database=os.getenv("DB_NAME", "bank_db"),
        user=os.getenv("DB_USER", "ctf_admin"),
        password=os.getenv("DB_PASSWORD", "super_secret_password")
    )
    cursor = conn.cursor()

    # --- CHANGE 1: FORCE THE DATABASE CONNECTION INTO INDIAN STANDARD TIME ---
    print("Setting database connection timezone to IST...")
    cursor.execute("SET TIME ZONE 'Asia/Kolkata';")

    print("Obliterating old schema...")
    cursor.execute("DROP TABLE IF EXISTS transactions, accounts, captured_flags, notifications, inventory, users, shop_items CASCADE;")

    print("Building new tables with CTF scoring & economy engine...")

    # --- CHANGE 2: USE TIMESTAMPTZ FOR USERS TABLE ---
    cursor.execute("""
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50),
        nickname TEXT,
        score INT DEFAULT 0,
        active_exploit_taint VARCHAR(100) DEFAULT NULL,
        last_attack_timestamp TIMESTAMPTZ,
        immunity_expires_at TIMESTAMPTZ
    );
    """)

    # 2. ACCOUNTS TABLE
    cursor.execute("""
    CREATE TABLE accounts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        account_number VARCHAR(50) UNIQUE,
        ifsc_code VARCHAR(50),
        account_type VARCHAR(50),
        balance DECIMAL(15,2)
    );
    """)

    # --- CHANGE 3: USE TIMESTAMPTZ AND NOW() FOR TRANSACTIONS TABLE ---
    cursor.execute("""
    CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        sender_account_id INT,
        receiver_account_id INT,
        amount DECIMAL(15,2),
        transfer_note TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    # --- CHANGE 4: USE TIMESTAMPTZ AND NOW() FOR CAPTURED FLAGS ---
    cursor.execute("""
    CREATE TABLE captured_flags (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        flag_type VARCHAR(50),
        points_awarded INT,
        ip_address VARCHAR(45) DEFAULT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    # --- CHANGE 5: USE TIMESTAMPTZ AND NOW() FOR NOTIFICATIONS TABLE ---
    cursor.execute("""
    CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    # 6. SHOP ITEMS TABLE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shop_items (
        name VARCHAR(100) PRIMARY KEY,
        description TEXT,
        cost DECIMAL(15,2),
        point_cost INT DEFAULT 0,
        icon VARCHAR(50),
        stock INT DEFAULT 10
    );
    """)

    # 7. INVENTORY TABLE
    cursor.execute("""
    CREATE TABLE inventory (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        item_name VARCHAR(100),
        quantity INT DEFAULT 0
    );
    """)

    cursor.execute("TRUNCATE TABLE transactions, accounts, users RESTART IDENTITY CASCADE;")

    print("Stocking the Black Market...")
    cursor.execute("TRUNCATE TABLE shop_items CASCADE;")

    cursor.execute("INSERT INTO shop_items (name, description, cost, point_cost, icon, stock) VALUES ('ESP8266 - Node MCU', 'A low-cost Wi-Fi microcontroller', 7000.00, 1000, 'Cpu', 10)")
    cursor.execute("INSERT INTO shop_items (name, description, cost, point_cost, icon, stock) VALUES ('RFID Module - RC522', 'Reads and writes RFID tags for identification', 3000.00, 550, 'RFID', 15)")
    cursor.execute("INSERT INTO shop_items (name, description, cost, point_cost, icon, stock) VALUES ('IR Receiver Module - TSOP1838', 'Receive infrared signals', 2400.00, 350, 'IR', 15)")
    cursor.execute("INSERT INTO shop_items (name, description, cost, point_cost, icon, stock) VALUES ('Buzzer Module', 'Buzzer Module',1000.00, 200, 'buzzer', 7)")
    cursor.execute("INSERT INTO shop_items (name, description, cost, point_cost, icon, stock) VALUES ('LED', 'Light Emitting Diode', 50.00, 350, 'LED', 15)")
    cursor.execute("INSERT INTO shop_items (name, description, cost, point_cost, icon, stock) VALUES ('Jumper Wire', 'Connectors', 20.00, 100, 'Jumper Wire', 10)")
    cursor.execute("INSERT INTO shop_items (name, description, cost, point_cost, icon, stock) VALUES ('Breadboard', 'Circuit', 20.00, 100, 'Breadboard', 16)")

    print("Injecting vulnerable users...")
    nolan_pw = hashlib.md5(b"Inception789").hexdigest()
    velora_pw = hashlib.md5(b"Gravity788").hexdigest()
    syndic_pw = hashlib.md5(b"Interstellar787").hexdigest()
    bob_pw = hashlib.md5(b"boba10").hexdigest()
    alice_pw = hashlib.md5(b"secret@123").hexdigest()

    # csrf_token = NULL on seed — gets populated on first login
    cursor.execute(f"INSERT INTO users (id, username, password, role, nickname) VALUES (10, 'Bob', '{bob_pw}', 'user', 'Bobin')")
    cursor.execute(f"INSERT INTO users (id, username, password, role, nickname) VALUES (788, 'Velora Vex', '{velora_pw}', 'user', 'Velora')")
    cursor.execute(f"INSERT INTO users (id, username, password, role, nickname) VALUES (787, 'Syndic Krell', '{syndic_pw}', 'user', 'Krell')")
    cursor.execute(f"INSERT INTO users (id, username, password, role, nickname) VALUES (789, 'Nolan Vex', '{nolan_pw}', 'manager', 'Nolan')")
    cursor.execute(f"INSERT INTO users (id, username, password, role, nickname) VALUES (1, 'Alice', '{alice_pw}', 'user', 'Alice')")

    print("Funding accounts...")
    cursor.execute("INSERT INTO accounts (user_id, account_number, ifsc_code, account_type, balance) VALUES (789, 'SX-1010', 'STLX330001', 'Manager', 1000000.00)")
    cursor.execute("INSERT INTO accounts (user_id, account_number, ifsc_code, account_type, balance) VALUES (788, 'SX-1001', 'STLX330002', 'Asst.Manager', 100000.00)")
    cursor.execute("INSERT INTO accounts (user_id, account_number, ifsc_code, account_type, balance) VALUES (787, 'SX-1002', 'STLX330002', 'Asst.Manager', 200000.00)")
    cursor.execute("INSERT INTO accounts (user_id, account_number, ifsc_code, account_type, balance) VALUES (10, 'SX-1003', 'STLX330002', 'Corporate', 50000.00)")
    cursor.execute("INSERT INTO accounts (user_id, account_number, ifsc_code, account_type, balance) VALUES (1, 'SX-1004', 'STLX330002', 'Savings', 5000.00)")

    # Sync auto-increment sequences
    cursor.execute("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));")
    cursor.execute("SELECT setval('accounts_id_seq', (SELECT MAX(id) FROM accounts));")

    conn.commit()
    cursor.close()
    conn.close()
    print("SUCCESS: Database is locked, loaded, and highly vulnerable in IST format!")

if __name__ == "__main__":
    seed_db()
