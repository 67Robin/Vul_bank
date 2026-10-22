# backend/main.py
from fastapi import FastAPI, Form, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import random
import hashlib
import secrets
import time
import os
import re
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse

FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", "3000"))

app = FastAPI(title="Neo-Bank API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vulnerable config for CTF
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        database=os.getenv("DB_NAME", "bank_db"),
        user=os.getenv("DB_USER", "ctf_admin"),
        port=os.getenv("DB_PORT", "5433"),
        password=os.getenv("DB_PASSWORD", "super_secret_password")
    )


# ──────────────────────────────────────────────
# AUTH
# ──────────────────────────────────────────────

@app.post("/api/v1/login")
def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    authorization: str = Header(None)
):
    real_attacker_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            real_attacker_id = int(authorization.split(" ")[1])
        except ValueError:
            pass

    conn = get_db_connection()
    cursor = conn.cursor()
    hashed_password = hashlib.md5(password.encode()).hexdigest()

    # VULNERABILITY: SQL Injection
    query = f"SELECT id, username, role, password FROM users WHERE username = '{username}' AND password = '{hashed_password}'"

    try:
        cursor.execute(query)
        matching_users = cursor.fetchall()

        if len(matching_users) > 1:
            raise HTTPException(
                status_code=403,
                detail="SQLi Error: Multiple accounts returned. You must target a specific bank account using their username."
            )

        if len(matching_users) == 1:
            user = matching_users[0]
            target_user_id = user[0]
            db_username = user[1]
            db_role = user[2]
            db_password = user[3]

            # Taint hook for SQL Injection detection
            if hashed_password != db_password:
                # Global Lockout Check for SQLi
                client_ip = request.client.host
                cursor.execute(
                    "SELECT id FROM captured_flags WHERE user_id = %s AND flag_type = %s LIMIT 1",
                    (real_attacker_id, "SQL_INJECTION")
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=403,
                        detail="VULNERABILITY PATCHED: You have already exploited SQL_INJECTION once."
                    )

                taint_value = f"SQL_INJECTION_BY_{real_attacker_id}" if real_attacker_id else "SQL_INJECTION_ANONYMOUS"
                cursor.execute("UPDATE users SET active_exploit_taint = %s WHERE id = %s", (taint_value, target_user_id))
            else:
                cursor.execute("UPDATE users SET active_exploit_taint = NULL WHERE id = %s", (target_user_id,))

            conn.commit()
            return {
                "message": "Login successful",
                "user_id": target_user_id,
                "username": db_username,
                "role": db_role,
            }

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        conn.rollback()
        print(f"DATABASE CRASH: {e}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

    raise HTTPException(status_code=401, detail="Invalid credentials")


# ──────────────────────────────────────────────
# USER DATA
# ──────────────────────────────────────────────

@app.get("/api/v1/user-data/{user_id}")
def get_user_dashboard_data(user_id: int, request: Request, authorization: str = Header(None)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Extract hacker_id from Authorization header (sent by frontend as hacker_id)
        hacker_id = None
        if authorization and authorization.startswith("Bearer "):
            try:
                hacker_id = int(authorization.split(" ")[1])
            except ValueError:
                pass

        # Global Lockout Check: Has THIS hacker already captured the IDOR flag?
        if hacker_id is not None and hacker_id != user_id:
            cursor.execute(
                "SELECT id FROM captured_flags WHERE user_id = %s AND flag_type = %s LIMIT 1",
                (hacker_id, "IDOR_TRANSFER")
            )
            if cursor.fetchone():
                # Check if this hacker is a manager (managers are exempt)
                cursor.execute("SELECT role FROM users WHERE id = %s", (hacker_id,))
                role_data = cursor.fetchone()
                if not role_data or role_data[0] != 'manager':
                    # Exception: Allow if hacker accessed this account via SQLi
                    cursor.execute("SELECT active_exploit_taint FROM users WHERE id = %s", (user_id,))
                    victim_data = cursor.fetchone()
                    victim_taint = victim_data[0] if victim_data else None
                    if not victim_taint or f"SQL_INJECTION_BY_{hacker_id}" not in victim_taint:
                        raise HTTPException(
                            status_code=403,
                            detail="VULNERABILITY PATCHED: You have already exploited IDOR_TRANSFER once."
                        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"IDOR Lockout Check Error: {e}")

    try:
        query = """
            SELECT u.username, u.nickname, u.score, a.balance, a.account_number
            FROM users u
            JOIN accounts a ON u.id = a.user_id
            WHERE u.id = %s
        """
        cursor.execute(query, (user_id,))
        data = cursor.fetchone()
        if not data:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "username": data[0],
            "nickname": data[1],
            "score": data[2],
            "balance": float(data[3]),
            "account_number": data[4]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# ACCOUNTS  (IDOR vulnerability)
# ──────────────────────────────────────────────

@app.get("/api/v1/accounts/{account_id}")
def get_account(account_id: int, request: Request, authorization: str = Header(None)):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Extract hacker_id from Authorization header (sent by frontend as hacker_id)
        hacker_id = None
        if authorization and authorization.startswith("Bearer "):
            try:
                hacker_id = int(authorization.split(" ")[1])
            except ValueError:
                pass

        # Global Lockout Check: Has THIS hacker already captured the IDOR flag?
        if hacker_id is not None and hacker_id != account_id:
            cursor.execute(
                "SELECT id FROM captured_flags WHERE user_id = %s AND flag_type = %s LIMIT 1",
                (hacker_id, "IDOR_TRANSFER")
            )
            if cursor.fetchone():
                # Check if this hacker is a manager (managers are exempt)
                cursor.execute("SELECT role FROM users WHERE id = %s", (hacker_id,))
                role_data = cursor.fetchone()
                if not role_data or role_data[0] != 'manager':
                    # Exception: Allow if hacker accessed this account via SQLi
                    cursor.execute("SELECT active_exploit_taint FROM users WHERE id = %s", (account_id,))
                    victim_data = cursor.fetchone()
                    victim_taint = victim_data[0] if victim_data else None
                    if not victim_taint or f"SQL_INJECTION_BY_{hacker_id}" not in victim_taint:
                        raise HTTPException(
                            status_code=403,
                            detail="VULNERABILITY PATCHED: You have already exploited IDOR_TRANSFER once."
                        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"IDOR Lockout Check Error: {e}")

    # VULNERABILITY: IDOR — no ownership check
    query = f"SELECT id, account_number, ifsc_code, account_type, balance FROM accounts WHERE user_id = {account_id}"
    try:
        cursor.execute(query)
        account = cursor.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database Error")
    finally:
        cursor.close()
        conn.close()

    if account:
        return {
            "id": account[0],
            "account_number": account[1],
            "ifsc_code": account[2],
            "account_type": account[3],
            "balance": float(account[4])
        }
    raise HTTPException(status_code=404, detail="Account not found")


# ──────────────────────────────────────────────
# IMMUNITY SHOP
# ──────────────────────────────────────────────

@app.post("/api/v1/buy-immunity")
def buy_immunity(authorization: str = Header(None)):
    attacker_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            attacker_id = int(authorization.split(" ")[1])
        except ValueError:
            pass

    if not attacker_id:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED. LOGIN REQUIRED.")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(f"SELECT balance FROM accounts WHERE user_id = {attacker_id}")
        acc_data = cursor.fetchone()
        cursor.execute(f"SELECT score FROM users WHERE id = {attacker_id}")
        user_data = cursor.fetchone()

        if not acc_data or acc_data[0] < 5000:
            raise HTTPException(status_code=400, detail="INSUFFICIENT FUNDS. NEED ₹5,000.")
        if not user_data or user_data[0] < 100:
            raise HTTPException(status_code=400, detail="INSUFFICIENT POINTS. NEED 100 POINTS.")

        cursor.execute(f"UPDATE accounts SET balance = balance - 5000 WHERE user_id = {attacker_id}")
        cursor.execute(f"UPDATE users SET score = score - 100 WHERE id = {attacker_id}")

        expiry_time = datetime.now() + timedelta(hours=1)
        cursor.execute("UPDATE users SET immunity_expires_at = %s WHERE id = %s", (expiry_time, attacker_id))

        conn.commit()
        return {"message": "🛡️ IRONCLAD SHIELD ACTIVATED. YOU ARE IMMUNE TO CYBER ATTACKS FOR 1 HOUR."}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# TRANSFER  (CSRF fixed here)
# ──────────────────────────────────────────────

MIN_TRANSACTION_LIMIT = 100.0
MAX_TRANSACTION_LIMIT = 30000.0

@app.post("/api/v1/transfer")
def transfer_funds(
    request: Request,
    sender_id: int = Form(...),
    receiver_account: str = Form(...),
    amount: float = Form(...),
    transfer_note: str = Form(""),
    authorization: str = Header(None),
):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    if amount < MIN_TRANSACTION_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Transaction amount is below the minimum limit of ₹{MIN_TRANSACTION_LIMIT:,.2f}"
        )

    if amount > MAX_TRANSACTION_LIMIT:
        raise HTTPException(
            status_code=400, 
            detail=f"Transaction amount is above the maximum limit of ₹{MAX_TRANSACTION_LIMIT:,.2f}"
        )

    attacker_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            attacker_id = int(authorization.split(" ")[1])
        except ValueError:
            pass

    if not attacker_id:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED. LOGIN REQUIRED.")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. Setup Receiver
        cursor.execute("SELECT id, user_id FROM accounts WHERE account_number = %s", (receiver_account,))
        receiver = cursor.fetchone()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver account not found")
        receiver_id, receiver_user_id = receiver

        # 2. Attacker context
        cursor.execute("SELECT role, active_exploit_taint FROM users WHERE id = %s", (attacker_id,))
        attacker_data = cursor.fetchone()
        attacker_role = attacker_data[0] if attacker_data else 'user'

        # 3. Sender/Victim data
        cursor.execute(
            "SELECT balance, active_exploit_taint FROM users u JOIN accounts a ON u.id = a.user_id WHERE u.id = %s",
            (sender_id,)
        )
        sender_record = cursor.fetchone()
        if not sender_record:
            raise HTTPException(status_code=404, detail="Sender account not found")

        current_balance, victim_taint = float(sender_record[0]), sender_record[1]

        # ── EXPLOIT DETECTION ENGINE ──
        detected_exploit = None
        scoring_id = attacker_id
        is_self_farming = (receiver_user_id == sender_id)

        # ── B. SQL Injection taint ───────────────────────────────────────────
        if not detected_exploit and victim_taint and "SQL_INJECTION" in victim_taint:
            detected_exploit = "SQL_INJECTION"
            scoring_id = receiver_user_id

        # ── C. Privilege Escalation ──────────────────────────────────────────
        if not detected_exploit and attacker_id != sender_id and attacker_role == 'manager':
            detected_exploit = "PRIVILEGE_ESCALATION"

        # ── D. IDOR ──────────────────────────────────────────────────────────
        if not detected_exploit and attacker_id != sender_id and attacker_role != 'manager':
            detected_exploit = "IDOR_TRANSFER"

        # ── E. XSS ───────────────────────────────────────────────────────────
        # Detect if the sender (victim) was exposed to an XSS payload sent by the receiver (attacker).
        if not detected_exploit and victim_taint and victim_taint.startswith("XSS_EXPOSED_BY_"):
            try:
                exposed_by_id = int(victim_taint.split("_")[-1])
                if receiver_user_id == exposed_by_id:
                    detected_exploit = "XSS_ATTACK"
            except ValueError:
                pass

        # 4. Immunity / Shield check
        if detected_exploit and not is_self_farming:
            cursor.execute("SELECT immunity_expires_at FROM users WHERE id = %s", (sender_id,))
            victim_data = cursor.fetchone()
            if victim_data and victim_data[0] and victim_data[0] > datetime.now(timezone.utc):
                wait_time = int((victim_data[0] - datetime.now(timezone.utc)).total_seconds() // 60)
                cursor.execute(
                    "INSERT INTO notifications (user_id, message) VALUES (%s, %s)",
                    (sender_id, f'🛡️ SHIELD ACTIVE: A cyber attack was deflected. Lockdown expires in {wait_time} minutes.')
                )
                conn.commit()
                raise HTTPException(status_code=403, detail=f"TARGET IS UNDER LOCKDOWN. Immunity active for {wait_time} minutes.")

        # 5. Execute transfer
        if current_balance >= amount:
            time.sleep(0.5)  # RACE CONDITION WINDOW

            cursor.execute("UPDATE accounts SET balance = balance - %s WHERE user_id = %s", (amount, sender_id))
            cursor.execute("UPDATE accounts SET balance = balance + %s WHERE id = %s", (amount, receiver_id))

            # Race condition check
            cursor.execute("SELECT balance FROM accounts WHERE user_id = %s", (sender_id,))
            new_sender_balance = float(cursor.fetchone()[0])
            if new_sender_balance < 0:
                detected_exploit = "RACE_CONDITION"

            # Log transaction
            cursor.execute(
                """INSERT INTO transactions (sender_account_id, receiver_account_id, amount, transfer_note)
                   VALUES (
                       (SELECT id FROM accounts WHERE user_id = %s),
                       (SELECT id FROM accounts WHERE account_number = %s),
                       %s, %s
                   )""",
                (sender_id, receiver_account, amount, transfer_note)
            )

            # 6. Bounty & alerts
            flag_message = ""
            is_self_farming = (receiver_user_id == sender_id)

            if detected_exploit and not is_self_farming:
                scoring_id = receiver_user_id

                client_ip = "unknown"
                if request.headers.get("x-forwarded-for"):
                    client_ip = request.headers.get("x-forwarded-for").split(",")[0].strip()
                elif request.client and request.client.host:
                    client_ip = request.client.host

                cursor.execute(
                    "SELECT id FROM captured_flags WHERE user_id = %s AND flag_type = %s LIMIT 1",
                    (attacker_id, detected_exploit)
                )
                already_captured = cursor.fetchone()

                if already_captured:
                    raise HTTPException(
                        status_code=403,
                        detail=f"VULNERABILITY PATCHED: You have already exploited {detected_exploit} once."
                    )
                else:
                    bounty = int(amount * 0.05)

                    cursor.execute("UPDATE users SET score = score + %s WHERE id = %s", (bounty, scoring_id))
                    cursor.execute(
                        "INSERT INTO captured_flags (user_id, flag_type, points_awarded, ip_address) VALUES (%s, %s, %s, %s)",
                        (attacker_id, detected_exploit, bounty, client_ip)
                    )
                    cursor.execute("UPDATE users SET last_attack_timestamp = CURRENT_TIMESTAMP WHERE id = %s", (scoring_id,))
                    cursor.execute(
                        "UPDATE users SET immunity_expires_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes' WHERE id = %s",
                        (sender_id,)
                    )
                    flag_message = f" | 🚩 {detected_exploit} DETECTED! +{bounty} Points."

                alert_msg = f'⚠️ SECURITY BREACH: ₹{amount:,.2f} Deducted via Attack <br/><b>Note:</b> {transfer_note}'
                cursor.execute(
                    "INSERT INTO notifications (user_id, message, timestamp) VALUES (%s, %s, CURRENT_TIMESTAMP)",
                    (sender_id, alert_msg)
                )
                cursor.execute(
                    "UPDATE users SET active_exploit_taint = %s WHERE id = %s",
                    (f"{detected_exploit}_PATCHED", sender_id)
                )

            conn.commit()
            return {"message": f"Transfer successful{flag_message}", "new_balance": new_sender_balance}
        else:
            raise HTTPException(status_code=400, detail="Insufficient funds")

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# TRANSACTIONS  (IDOR + Stored XSS vulnerability)
# ──────────────────────────────────────────────

@app.get("/api/v1/transactions/{account_id}")
def get_transactions(account_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = f"""
        SELECT t.id, t.sender_account_id, t.receiver_account_id, t.amount, t.transfer_note, t.timestamp,
               sa.account_number AS sender_account, ra.account_number AS receiver_account
        FROM transactions t
        LEFT JOIN accounts sa ON sa.id = t.sender_account_id
        LEFT JOIN accounts ra ON ra.id = t.receiver_account_id
        WHERE t.sender_account_id = {account_id} OR t.receiver_account_id = {account_id}
        ORDER BY t.timestamp DESC
    """
    try:
        cursor.execute(query)
        transactions = cursor.fetchall()

        # Check if this account owner is exposed to XSS from received transfers
        cursor.execute("SELECT user_id FROM accounts WHERE id = %s", (account_id,))
        user_row = cursor.fetchone()
        if user_row:
            victim_user_id = user_row[0]
            # Check for any script or onerror payloads sent to this account
            cursor.execute("""
                SELECT sa.user_id 
                FROM transactions t
                JOIN accounts sa ON t.sender_account_id = sa.id
                WHERE t.receiver_account_id = %s 
                  AND (LOWER(t.transfer_note) LIKE '%%<script%%' OR LOWER(t.transfer_note) LIKE '%%onerror%%')
                LIMIT 1
            """, (account_id,))
            attacker_row = cursor.fetchone()
            if attacker_row:
                attacker_user_id = attacker_row[0]
                cursor.execute("""
                    UPDATE users 
                    SET active_exploit_taint = %s 
                    WHERE id = %s AND (active_exploit_taint IS NULL OR active_exploit_taint NOT LIKE 'XSS_EXPOSED_BY_%%')
                """, (f"XSS_EXPOSED_BY_{attacker_user_id}", victim_user_id))
                conn.commit()

        result = []
        for tx in transactions:
            result.append({
                "id": tx[0],
                "sender_id": tx[1],
                "receiver_id": tx[2],
                "amount": float(tx[3]),
                "transfer_note": tx[4],  # VULNERABILITY: Stored XSS
                "timestamp": str(tx[5]) if tx[5] else None,
                "sender_account": tx[6],
                "receiver_account": tx[7],
            })
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Database Error")
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# PROFILE  (XSS + Privilege Escalation vulnerability)
# ──────────────────────────────────────────────

@app.post("/api/v1/update_profile")
def update_profile(
    user_id: int = Form(...),
    nickname: str = Form(...),
    role: str = Form(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # VULNERABILITY: Stored XSS (nickname not sanitized)
        cursor.execute("UPDATE users SET nickname = %s WHERE id = %s", (nickname, user_id))

        # VULNERABILITY: Privilege Escalation
        if role:
            cursor.execute("UPDATE users SET role = %s WHERE id = %s", (role, user_id))
            if role.lower() == 'manager':
                cursor.execute("UPDATE users SET active_exploit_taint = 'PRIVILEGE_ESCALATION' WHERE id = %s", (user_id,))

        conn.commit()
        return {"message": "Profile updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Database Error")
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# REGISTER
# ──────────────────────────────────────────────

@app.post("/api/v1/register")
def register_player(
    username: str = Form(...),
    password: str = Form(...),
    nickname: str = Form(...)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT id FROM users WHERE username = '{username}'")
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")

        hashed_pw = hashlib.md5(password.encode()).hexdigest()
        cursor.execute(
            f"INSERT INTO users (username, password, role, nickname) "
            f"VALUES ('{username}', '{hashed_pw}', 'user', '{nickname}') RETURNING id"
        )
        new_user_id = cursor.fetchone()[0]

        acct_num = f"SX-{random.randint(10000, 99999)}"
        cursor.execute(
            f"INSERT INTO accounts (user_id, account_number, ifsc_code, account_type, balance) "
            f"VALUES ({new_user_id}, '{acct_num}', 'STLX0000002', 'Savings', 5000.00)"
        )

        conn.commit()
        return {
            "message": "Player registered successfully",
            "user_id": new_user_id,
            "account_number": acct_num
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# NOTIFICATIONS
# ──────────────────────────────────────────────

@app.get("/api/v1/notifications")
def get_notifications(authorization: str = Header(None)):
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            user_id = int(authorization.split(" ")[1])
        except ValueError:
            pass

    if not user_id:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED. LOGIN REQUIRED.")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            f"SELECT id, message, timestamp, is_read FROM notifications WHERE user_id = {user_id} ORDER BY timestamp DESC"
        )
        rows = cursor.fetchall()
        cursor.execute(f"UPDATE notifications SET is_read = TRUE WHERE user_id = {user_id}")
        conn.commit()

        return {"notifications": [
            {"id": r[0], "message": r[1], "timestamp": str(r[2]), "is_read": r[3]}
            for r in rows
        ]}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# LEADERBOARD
# ──────────────────────────────────────────────

@app.get("/api/v1/leaderboard")
def get_leaderboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT u.username, u.nickname, u.score, a.account_number
            FROM users u
            LEFT JOIN accounts a ON u.id = a.user_id
            ORDER BY u.score DESC
            LIMIT 50
        """)
        top_users = cursor.fetchall()
        return {"leaderboard": [
            {
                "rank": i + 1,
                "team_name": u[0],
                "nickname": u[1],
                "score": u[2],
                "target_account": u[3] if u[3] else "UNREGISTERED"
            }
            for i, u in enumerate(top_users)
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# STATS
# ──────────────────────────────────────────────

@app.get("/api/v1/stats/breaches")
def get_breach_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(id) FROM captured_flags")
        total_breaches = cursor.fetchone()[0]
        return {"total_breaches": total_breaches}
    except Exception:
        return {"total_breaches": 0}
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# INVENTORY
# ──────────────────────────────────────────────

@app.get("/api/v1/inventory/{user_id}")
def get_inventory(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT item_name, quantity FROM inventory WHERE user_id = %s", (user_id,))
        items = cursor.fetchall()
        return {"inventory": [{"item_name": r[0], "quantity": r[1]} for r in items]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ──────────────────────────────────────────────
# SHOP
# ──────────────────────────────────────────────

@app.get("/api/v1/shop/items")
def get_shop_items():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, description, cost, point_cost, icon, stock FROM shop_items ORDER BY cost ASC")
        items = cursor.fetchall()
        return {"catalog": [
            {"name": r[0], "description": r[1], "cost": float(r[2]),
             "point_cost": int(r[3]), "icon": r[4], "stock": r[5]}
            for r in items
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.post("/api/v1/shop/buy")
def secure_buy_item(
    item_name: str = Form(...),
    auth_username: str = Form(...),
    auth_password: str = Form(...),
    authorization: str = Header(None)
):
    buyer_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            buyer_id = int(authorization.split(" ")[1])
        except ValueError:
            pass

    if not buyer_id:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED. NO SESSION.")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        hashed_pw = hashlib.md5(auth_password.encode()).hexdigest()
        cursor.execute(
            "SELECT id FROM users WHERE username = %s AND password = %s",
            (auth_username, hashed_pw)
        )
        real_user = cursor.fetchone()
        if not real_user or real_user[0] != buyer_id:
            raise HTTPException(status_code=403, detail="SECURITY ALERT: Invalid purchase credentials.")

        cursor.execute("SELECT cost, point_cost, stock FROM shop_items WHERE name = %s", (item_name,))
        shop_data = cursor.fetchone()
        if not shop_data:
            raise HTTPException(status_code=400, detail="ITEM DOES NOT EXIST.")

        cost, point_cost, stock = float(shop_data[0]), int(shop_data[1]), shop_data[2]
        if stock <= 0:
            raise HTTPException(status_code=400, detail="OUT OF STOCK.")

        cursor.execute("SELECT balance FROM accounts WHERE user_id = %s", (buyer_id,))
        acc_data = cursor.fetchone()
        cursor.execute("SELECT score FROM users WHERE id = %s", (buyer_id,))
        user_data = cursor.fetchone()

        if not acc_data or float(acc_data[0]) < cost:
            raise HTTPException(status_code=400, detail=f"INSUFFICIENT FUNDS. NEED ₹{cost:,.2f}.")
        if not user_data or int(user_data[0]) < point_cost:
            raise HTTPException(status_code=400, detail=f"INSUFFICIENT POINTS. NEED {point_cost} PTS.")

        cursor.execute("UPDATE accounts SET balance = balance - %s WHERE user_id = %s", (cost, buyer_id))
        cursor.execute("UPDATE users SET score = score - %s WHERE id = %s", (point_cost, buyer_id))
        cursor.execute("UPDATE shop_items SET stock = stock - 1 WHERE name = %s", (item_name,))

        cursor.execute("SELECT id FROM inventory WHERE user_id = %s AND item_name = %s", (buyer_id, item_name))
        existing_item = cursor.fetchone()
        if existing_item:
            cursor.execute("UPDATE inventory SET quantity = quantity + 1 WHERE id = %s", (existing_item[0],))
        else:
            cursor.execute("INSERT INTO inventory (user_id, item_name, quantity) VALUES (%s, %s, 1)", (buyer_id, item_name))

        conn.commit()
        return {"message": f"SECURE PURCHASE COMPLETE: {item_name}"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()