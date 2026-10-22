-- db/init.sql
-- This builds the core infrastructure the moment the Docker container starts.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50),
    nickname TEXT,
    score INT DEFAULT 0,
    active_exploit_taint VARCHAR(100) DEFAULT NULL,
    last_attack_timestamp TIMESTAMP,
    immunity_expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(50) UNIQUE,
    ifsc_code VARCHAR(50),
    account_type VARCHAR(50),
    balance DECIMAL(15,2)
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    sender_account_id INT,
    receiver_account_id INT,
    amount DECIMAL(15,2),
    transfer_note TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS captured_flags (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    flag_type VARCHAR(50),
    points_awarded INT,
    ip_address VARCHAR(45) DEFAULT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(100),
    quantity INT DEFAULT 0
);