# 🏦 StellarX — Vulnerable Banking & CTF Platform

[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Ready-blue?logo=docker)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-336791?logo=postgresql)](https://www.postgresql.org/)
[![Cybersecurity](https://img.shields.io/badge/Purpose-Cybersecurity%20Education%20%26%20CTF-crimson)](#)

* [Click here for Demo](https://stellarx.robinkp.win)

**StellarX** (also known as **Vul_Bank**) is a full-stack, containerized banking web application intentionally engineered with realistic security vulnerabilities for cybersecurity training, ethical hacking workshops, and Capture The Flag (CTF) competitions.

Unlike traditional static vulnerable labs, StellarX features a **dynamic exploit detection engine**, **taint tracking**, an **automated bounty/XP scoring system**, and an **in-game hardware shop** that simulates high-stakes financial cyberattacks in a safe, controlled sandbox.

---

## 🎯 What is this Project & How Does It Help?

### 💡 The Problem
Most cybersecurity students and developers learn application security theoretically through slides or artificial puzzle-style challenges that bear little resemblance to modern enterprise web applications. As a result, learners struggle to understand:
* How vulnerabilities manifest across real-world, multi-tier architectures (Frontend ↔ Backend ↔ Database).
* How distinct flaws (such as IDOR, XSS, and SQL Injection) can be chained together to achieve financial compromise.
* How business logic flaws affect transaction integrity and session state.

### 🛡️ How StellarX Helps
StellarX bridges the gap between theory and practical offensive/defensive security by providing:

1. **Realistic Banking Simulation**:
   A sleek, modern neobank interface (Next.js with glassmorphism UI) equipped with user profiles, multi-tier bank accounts, real-time fund transfers, transaction histories, support tickets, and role-based administrative panels.

2. **Chained Attack Scenarios**:
   Learners don't just find a bug; they must exploit vulnerabilities to manipulate financial logic—transferring funds from targeted victim accounts into their own to earn XP.

3. **Active Taint Tracking & Exploit Detection**:
   The backend inspects transactions in real-time. When an unauthorized action or tainted session executes a transfer, the platform automatically validates the exploit, calculates a 5% bounty in XP, triggers victim breach alerts, and grants temporary victim immunity to prevent spam.

4. **Integrated Hardware & Black-Market Shop**:
   Earned XP and stolen currency can be spent in the in-game Shop to purchase hardware modules (ESP8266, RFID RC522, IR Receivers, etc.), unlocking secondary physical and hardware-based CTF challenges.

5. **Safe, Self-Contained Deployment**:
   Fully packaged with Docker Compose, allowing schools, universities, enterprise red/blue teams, and security clubs to launch an isolated training range in seconds with zero configuration.

---

## 🏗️ Architecture & Technology Stack

StellarX runs as three containerized services connected through a private Docker bridge network:

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser / Client                      │
└───────────────────────┬───────────────────────────────┬─────┘
                        │ Port 33333                    │ Port 8000
                        ▼                               ▼
      ┌───────────────────────────────────┐   ┌───────────────────────────────────┐
      │         stellarx_frontend         │   │         stellarx_backend          │
      │           (Next.js 15)            │──▶│             (FastAPI)             │
      │  Dark Glassmorphism UI, Lucide,   │   │  Taint tracking, Exploit engine,  │
      │  State & Dashboard Management     │   │  MD5 Auth, Swagger /docs API      │
      └───────────────────────────────────┘   └─────────────────┬─────────────────┘
                                                                │ Port 5432
                                                                ▼
                                              ┌───────────────────────────────────┐
                                              │            stellarx_db            │
                                              │         (PostgreSQL 15)           │
                                              │  IST Timestamps, Accounts, Flags, │
                                              │  Transactions, Users, Inventory   │
                                              └───────────────────────────────────┘
```

| Component | Technology | Default Port | Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 15, React, Tailwind / Vanilla CSS | `33333` (mapped from `3000`) | Client portal, dashboard, transfers, shop, and CTF guide |
| **Backend** | Python 3.10, FastAPI, Uvicorn, psycopg2 | `8000` | REST API, exploit validation, taint monitoring, score calculation |
| **Database** | PostgreSQL 15 Alpine | `5433` (mapped from `5432`) | Persistent storage for users, accounts, captured flags, and ledger |

---

## 🚩 Core Vulnerabilities & Exploit Matrix

The platform is intentionally designed with major OWASP Top 10 vulnerabilities:

| Vulnerability | Attack Vector / Endpoint | Impact & Objective |
| :--- | :--- | :--- |
| **SQL Injection (SQLi)** | `POST /api/v1/login` (Unescaped query parameters) | Bypass authentication to hijack high-balance accounts. |
| **Insecure Direct Object Reference (IDOR)** | `GET /api/v1/account/{account_id}` & `/api/v1/transfer` | View unauthorized account details and siphon funds without account ownership verification. |
| **Stored Cross-Site Scripting (Stored XSS)** | `POST /api/v1/transfer` (`transfer_note`) & `POST /api/v1/user/nickname` | Inject malicious scripts rendered in victim transaction feeds or profile badges to trigger client-side actions. |
| **Privilege Escalation** | `POST /api/v1/user/profile` (Role tampering) | Escalate privileges from `user` to `manager` to unlock administrative endpoints. |
| **Race Conditions** | `POST /api/v1/transfer` (Concurrent execution flaws) | Execute rapid parallel transfer requests to cause double-spending or bypass balance checks. |
| **Broken Cryptography** | Password hashing logic | MD5 without salting, enabling rainbow table cracking. |
| **Security Misconfiguration** | CORS Middleware (`allow_origins=["*"]`) | Insecure CORS headers allowing cross-origin credentialed attacks. |

---

## 👥 Pre-seeded Test Accounts

The platform includes pre-configured accounts with varying balances and privilege levels:

| User ID | Username | Password | Account Number | Initial Balance | Role |
| :---: | :--- | :--- | :---: | :---: | :---: |
| `789` | **Nolan Vex** | `Inception789` | `SX-1010` | ₹1,000,000.00 | `manager` |
| `788` | **Velora Vex** | `Gravity788` | `SX-1001` | ₹100,000.00 | `user` (Asst. Manager) |
| `787` | **Syndic Krell** | `Interstellar787` | `SX-1002` | ₹200,000.00 | `user` (Asst. Manager) |
| `10` | **Bob** | `boba10` | `SX-1003` | ₹50,000.00 | `user` (Corporate) |
| `1` | **Alice** | `secret@123` | `SX-1004` | ₹5,000.00 | `user` (Savings) |

> 💡 **Tip**: High-value accounts (such as Nolan Vex and Velora Vex) yield significantly higher XP bounties when targeted during exploit-based transfers!

---

## ⚡ Quick Start Guide

### 1. Prerequisites
Make sure you have installed:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS, Linux, or Windows)
* [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone <repository_url>
cd vulnerable-bank
```

### 3. Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```
Default configuration values:
```env
DB_USER=ctf_admin
DB_PASSWORD=super_secret_password
DB_NAME=bank_db
DB_PORT=5432
FRONTEND_ORIGIN=http://localhost:33333
BACKEND_URL=http://backend:8000
```

### 4. Build and Start the Containers
Launch all three services in the background:
```bash
docker-compose up -d --build
```

### 5. Initialize & Seed the Database
Populate the database with the pre-seeded accounts, ledger, and shop inventory:
```bash
docker-compose exec backend python seed.py
```

### 6. Access the Application
* **Frontend Web Application**: [http://localhost:33333](http://localhost:33333)
* **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Interactive Operations Manual**: [http://localhost:33333/instructions](http://localhost:33333/instructions)

---

## 🎮 How Gameplay & Scoring Work

1. **Reconnaissance**: Log in to a regular account (e.g., Alice or Bob), explore the dashboard, inspect network calls, headers, and API documentation.
2. **Identify Weakness**: Spot authorization oversights, unescaped queries, or unsanitized input fields.
3. **Execute the Exploit**: Use tools like Burp Suite, Python scripts, or browser DevTools to perform an unauthorized transfer from a victim account.
4. **Scoring Rules**:
   * **Normal Transfers**: Moving funds with proper authorization grants **0 XP**.
   * **Exploit Transfers**: When a valid exploit is detected by the backend, the player receives an XP bounty equal to **5% of the transferred amount**.
   * **Exhaustion & Immunity**: Once an exploit type is used against a target, the vulnerability is flagged as exhausted for that round, and the victim gains a 5-minute immunity window.
5. **Shop & Hardware Progression**: Visit `/shop` to exchange accumulated capital and XP for hardware tools to complete advanced challenges.

---

## 🛑 Rules of Engagement & Disclaimer

> [!CAUTION]
> **Educational & Testing Purposes Only**
> This application contains deliberate security vulnerabilities and is designed strictly for local cybersecurity research, penetration testing practice, and educational workshops.
> 
> * **DO NOT** deploy this application to a public, production-facing server without proper isolation (e.g., VPN / internal sandbox network).
> * **DO NOT** use credentials, code patterns, or configurations from this repository in production environments.
> * The authors assume no liability for misuse of the techniques demonstrated in this project.

---

## 🛠️ Management & Teardown

* **View live service logs**:
  ```bash
  docker-compose logs -f backend
  ```
* **Stop all containers**:
  ```bash
  docker-compose down
  ```
* **Reset the entire database to a clean slate**:
  ```bash
  docker-compose down -v
  docker-compose up -d
  docker-compose exec backend python seed.py
  ```

---

