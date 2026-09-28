# AUTHSHIELD 360
### Theme: "VerifyVault - Identity Beyond Passwords"
**Category:** Ethical Cyber Horizons (Aptech Techwiz)  
**Application Type:** Educational Identity Security, Multi-Factor Authentication & SOC Testing Platform  
**Architecture:** Full-Stack Node.js/Express + React 19 + Tailwind CSS + In-Memory Seeded Database

## Project Guides

- [User Guide](README_USER.md): sign-in, role dashboards, MFA modes, and lab workflows.
- [Developer Guide](README_DEVELOPER.md): setup, configuration, architecture, API areas, and development notes.

> **Implementation note:** The current database is seeded in process memory and resets when the server restarts; it is not file-backed or production-persistent. This repository is an educational lab/demo, not a production identity service. See the guides for current behavior and safety notes.

---

## 1. Executive Summary & Objective

**AuthShield 360** is a production-grade educational identity-security application built under the theme *"VerifyVault — Identity Beyond Passwords"*. It empirically demonstrates the severe vulnerability of single-factor password-only authentication and proves how Multi-Factor Authentication (MFA), strict server-side Role-Based Access Control (RBAC), failed-login lockout protection, cryptographic session management, and continuous SOC forensic logging establish zero-trust identity assurance.

Built around a fictional academic institution (**Apex Cyber Academy**), the platform utilizes **100% fictional/sample school data** and safe participant-owned communication channels for evaluation.

---

## 2. Initial Primary Administrator (Requirement 1)

When first initialized, the system provisions **ONLY ONE Initial Root Administrator**:

* **Admin Name:** Ayan
* **Admin Email:** `ayanaptechh@gmail.com`
* **Admin Password:** `Techwiz2254@`
* **Admin WhatsApp Number:** `+923709001226`
* **Role:** `ADMINISTRATOR`
* **Authority:** Full administrative control over all users, policies, active sessions, support tickets, and audit trails.

> **DEMO / LAB TEST ACCOUNTS (Clearly Separated):**
> * **Student (Lab Demo):** `student@test.local` / `Student@123`
> * **Faculty (Lab Demo):** `teacher@test.local` / `Teacher@123`

---

## 3. Multi-Tier Login Flows & MFA Enforcement (Section 6)

The application enforces strict role-specific multi-factor authentication policies:

### 1. Student Login
* **Inputs:** Email + Password
* **Flow:** Validates password $\to$ Immediately issues authenticated Student session and applies Student RBAC $\to$ Records `LOGIN_SUCCESS`.
* *Note:* Students do not receive Teacher/Admin MFA challenges unless the evaluator explicitly switches the global lab mode to Mode 2 or Mode 3 for comparison benchmark testing.

### 2. Teacher Login
* **Inputs:** Email + Password
* **Flow:** Validates password $\to$ Generates cryptographically secure 6-digit OTP $\to$ Dispatches code to registered WhatsApp number via **UltraMsg** $\to$ Prompts OTP verification screen $\to$ Upon valid entry: grants authenticated Teacher session.

### 3. Administrator Login (Maximum Assurance Profile)
* **Inputs:** Email + Password
* **Flow:**
  1. Validates master password via Scrypt.
  2. Generates secure 6-digit WhatsApp OTP $\to$ Dispatches to Admin's registered WhatsApp number (`+923709001226`) via **UltraMsg**.
  3. Administrator verifies WhatsApp OTP.
  4. Automatically triggers Step 3: Generates independent Email OTP $\to$ Dispatches to Admin's registered email (`ayanaptechh@gmail.com`) via **Gmail SMTP**.
  5. Administrator verifies Email OTP.
  6. **Only after BOTH out-of-band factors are verified:** Authenticated Administrator session is issued.
* **Security Rule:** Administrator can NEVER bypass either factor.

---

## 4. Authentication Modes Comparison (Section 4 & 23)

Evaluators can switch between the three scenarios via the top navbar or SOC dashboard:

| Authentication Mode | Security Strength | Usability | Example Risk Reduced |
| :--- | :--- | :--- | :--- |
| **Mode 1: Password-Only** | Low to Medium | Very Easy | Adds no protection if password is compromised or phished. |
| **Mode 2: Password + Mobile OTP (WhatsApp via UltraMsg)** | Medium to High | Easy to Moderate | Stolen password alone is insufficient; requires mobile device possession. |
| **Mode 3: Password + Mobile OTP + Email Step-Up Verification** | Highest Assurance | Moderate | Defense-in-depth isolation across independent physical cellular & digital mailbox channels. |

---

## 5. Mobile & Email OTP Delivery Gateways

### UltraMsg WhatsApp Gateway (Section 5 & 37)
* Out-of-band mobile delivery for participant-owned mobile devices.
* **Environment Variables:**
  * `ULTRAMSG_INSTANCE_ID=`
  * `ULTRAMSG_TOKEN=`
* **Security Guarantee:** `ULTRAMSG_TOKEN` is NEVER exposed to frontend code, network responses, browser console, or logs.
* If credentials are not set, the platform provides graceful fallback notice and registers codes in the secure lab inspection stream.

### Gmail / SMTP Step-Up Service (Section 8 & 38)
* Dispatches branded HTML step-up verification codes via Nodemailer.
* **Environment Variables:**
  * `GMAIL_USER=`
  * `GMAIL_APP_PASSWORD=` (16-character Google App Password)

---

## 6. OTP Security Hardening (Section 7)

* **Cryptographic Generation:** 6-digit integers using Node.js `crypto.randomInt(100000, 1000000)`.
* **Zero Plaintext Storage:** Server stores salted SHA-256 hashes (`codeHash` + `codeSalt`).
* **Timing-Safe Comparison:** `crypto.timingSafeEqual` prevents side-channel timing attacks.
* **Strict Single-Use:** Verified codes are instantly invalidated.
* **Rate-Limiting & Expiry:** 5-minute configurable TTL window; maximum 5 attempts per challenge.
* **Resend Cooldown:** 30-second cooldown prevents SMS/WhatsApp flooding.
* **No Plaintext Leakage:** OTPs are never returned in client API response payloads.

---

## 7. Complete Admin Control Center (Sections 12, 15, 16, 17, 18, 42)

The Administrator has complete visibility and authority:

* **Identity Directory (`/users`):** Provision new Students, Teachers, and Admins; edit profiles; change WhatsApp numbers; reset passwords.
* **Suspension & Ban Engine:** Suspend with reason & duration (24h, 7d, indefinite) or permanently ban. Users attempting login receive professional restriction notices with appeal buttons.
* **Active Session Manager (`/sessions`):** View all active sessions, token masks, client IPs, user-agents, and revoke any session in real time.
* **Support Appeals Desk (`/tickets`):** Review user complaints, appeals, and lockout inquiries; update statuses (`PENDING`, `IN_PROGRESS`, `COMPLETED`); respond to users.
* **Security Alerts (`/monitoring`):** Real-time alerts categorized by severity (`CRITICAL`, `HIGH`, `WARNING`, `INFO`).
* **Forensic Reports (`/reports`):** Full system audit summary exportable to JSON or print-ready PDF view.

---

## 8. Identity Security Test Matrix (T01 - T12)

The platform includes an automated test runner executing all 12 mandatory SRS test cases:

| Test ID | Title | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **T01** | Valid password-only login | Authorized immediately; session token issued. | **PASS** |
| **T02** | Compromised password attempt | HTTP 401 Unauthorized; failed attempt logged with IP. | **PASS** |
| **T03** | Correct password without required MFA | Session blocked pending second factor. | **PASS** |
| **T04** | Valid OTP verification | Secondary possession factor verified; session granted. | **PASS** |
| **T05** | Invalid OTP rejection | HTTP 400 "Invalid verification code." | **PASS** |
| **T06** | Expired OTP rejection | Replay rejected after TTL expiration. | **PASS** |
| **T07** | Repeated failed logins (Lockout) | HTTP 423 Locked after 5th consecutive failure. | **PASS** |
| **T08** | Student $\to$ Teacher/Admin API | HTTP 403 Forbidden with `UNAUTHORIZED_ROLE`. | **PASS** |
| **T09** | Teacher $\to$ Admin Resource | HTTP 403 Forbidden with `UNAUTHORIZED_ROLE`. | **PASS** |
| **T10** | Session Revocation Replay | HTTP 401 Unauthorized; revoked token rejected. | **PASS** |
| **T11** | Email Step-Up Verification | Multi-channel 3-factor sequence verified. | **PASS** |
| **T12** | Admin Account Recovery & Unlock | Lockout state cleared and counters reset to 0. | **PASS** |

---

## 9. Installation & Execution

### Prerequisites
* Node.js v20+ or v22+
* npm v10+

### Environment Setup
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Configure credentials in `.env`:
   ```ini
   ULTRAMSG_INSTANCE_ID=your_instance_id
   ULTRAMSG_TOKEN=your_ultramsg_token
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_16_digit_app_password
   ```

### Running the System
```bash
# Install dependencies
npm install

# Start development full-stack server (Port 3000)
npm run dev

# Run TypeScript linting verification
npm run lint

# Build for production
npm run build
```

The application will be accessible at `http://localhost:3000`.

---

## 10. Demonstration Guide for Evaluators

1. **Step 1 — Baseline Password-Only Login:**
   * Select **Lab Demo Student** (`student@test.local` / `Student@123`).
   * Click **Verify Identity** $\to$ Direct login into Student Academic Portal.
2. **Step 2 — Two-Factor Authentication:**
   * Select **Lab Demo Faculty** (`teacher@test.local` / `Teacher@123`).
   * Password verified $\to$ Prompted for WhatsApp Mobile OTP (delivered via UltraMsg).
3. **Step 3 — High Assurance Root Admin Multi-Tier Login:**
   * Click **Initial Administrator (Ayan)** (`ayanaptechh@gmail.com` / `Techwiz2254@`).
   * Step 1: Password verified.
   * Step 2: Prompted for WhatsApp OTP $\to$ Enter code.
   * Step 3: Prompted for Email OTP (delivered via Gmail SMTP) $\to$ Enter code $\to$ Full Admin Access.
4. **Step 4 — Automated Test Matrix Execution:**
   * Navigate to **Test Matrix** $\to$ Click **Run All Automated Tests (T01 - T12)** $\to$ Watch all 12 pass with real audit evidence.
5. **Step 5 — Active Session Revocation:**
   * Open **Sessions** tab $\to$ Click **Revoke Session** $\to$ Verify immediate invalidation.
6. **Step 6 — User Ban & Appeal:**
   * In **Users**, ban `student@test.local` with a reason.
   * Attempt student login $\to$ View professional restriction message $\to$ Click **Submit Appeal** $\to$ Review ticket in **Support Desk**.
