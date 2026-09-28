# AuthShield 360 — User Guide & Operational Manual
> **VerifyVault: Identity Beyond Passwords**  
> *Production-Grade Cybersecurity Educational Lab & Identity Management Platform*

![AuthShield Architecture](/images/authshield_architecture.jpg)

---

## 1. Executive Summary & Overview

**AuthShield 360** is an interactive, zero-trust cybersecurity educational platform designed to demonstrate modern identity verification, defensive perimeter controls, and access management. It showcases the architectural progression from traditional **Password-Only** authentication to out-of-band **Multi-Factor Authentication (OTP via WhatsApp/Email)** and cryptographically isolated **Time-based One-Time Passwords (TOTP / Google Authenticator)** compliant with **RFC 6238**.

The platform simulates an academic and security operations environment (**Vision Heights Academy**) with three distinct user roles:
1. **Cadet / Student**: Accesses coursework, timetables, academic grades, and private grievance tickets.
2. **Faculty / Teacher**: Evaluates submissions, publishes student grades, and reviews academic telemetry.
3. **Administrator / SOC Director**: Manages system lockouts, revokes suspicious sessions, inspects real-time audit logs, conducts cryptographic security matrix tests, and resets user 2FA keys.

---

## 2. Platform Architecture & Visual Flow

![AuthShield Auth Flow](/images/authshield_auth_flow.jpg)

### Multi-Factor Verification Lifecycle:
1. **Step 1: Credential Verification**
   - User inputs Email and Password.
   - Passwords are validated using cryptographically salted `scrypt` key derivation with constant-time equality comparisons.
   - If 5 consecutive failed attempts occur, the account enters an automated temporary lockout (default: 15 minutes).
2. **Step 2: Out-of-Band Challenge (WhatsApp / Email OTP)**
   - When OTP MFA is active, an encrypted 6-digit one-time code is dispatched via the configured gateway (WhatsApp UltraMsg or Gmail SMTP).
   - In offline/lab demonstration mode, all OTP codes are routed to the **Lab Inspector Drawer** for seamless offline evaluation.
   - Codes expire strictly after 5 minutes and enforce a 60-second resend cooldown.
3. **Step 3: Cryptographic TOTP Verification (RFC 6238)**
   - Users with 2FA enabled enter their 6-digit rolling authenticator code (Google Authenticator, Microsoft Authenticator, or 1Password).
   - Server validates the HMAC-SHA1 signature within a ±30-second window and enforces replay attack mitigation.
4. **Step 4: Role-Based Session Issuance**
   - Upon completing all required stages, a fresh cryptographically random session token is issued, preventing session fixation vulnerabilities.

---

## 3. Seed Demo Accounts & Credentials

The platform comes pre-seeded with institutional test accounts representing each security tier:

| Role | Email | Password | Multi-Factor Tiers Supported | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student@test.local` | `Student@123` | Password-Only / Optional MFA | Standard student access; assignments & grades. |
| **Teacher** | `teacher@test.local` | `Teacher@123` | Password + WhatsApp OTP + TOTP | Faculty portal; course grading & student roster. |
| **Administrator** | `ayanaptechh@gmail.com` | `Techwiz2254@` | Triple-Factor: Password + WhatsApp + TOTP | Full SOC console, test matrix, & user administration. |

> **⚠️ Security Notice:** These are fictional sandbox credentials designed strictly for local educational evaluation. The in-memory database re-seeds automatically upon server restart.

---

## 4. Step-by-Step User Instructions

### 4.1 Launching and Navigating the Application
1. Open the application URL in any modern web browser.
2. The **Homepage** introduces the platform's zero-trust principles, 3D sentinel model, STEM academic disciplines, and the core engineering team (**Ayan Khan**, **Yasir Khan**, **M. Alwaz**, and **Tayyaba Shahzad**).
3. Click **"Sign In"** or **"Launch Portal Login"** in the navigation header or hero section.

### 4.2 Logging In as a Student
1. Enter `student@test.local` and `Student@123` (or click the quick demo pill **"Cadet Demo"**).
2. Click **"Continue to Session"**.
3. In default mode, students are authenticated directly into the **Cadet Portal**, where they can:
   - View their enrolled courses (e.g., Cryptography, Network Defense).
   - Review grade summaries and attendance metrics.
   - Download assigned coursework files.
   - Submit confidential student support inquiries.

### 4.3 Logging In as a Teacher
1. Enter `teacher@test.local` and `Teacher@123`.
2. Follow the multi-factor prompt:
   - Enter the WhatsApp OTP code (obtained via connected WhatsApp device or the **Lab Inspector Drawer** in bottom-right).
   - If 2FA is enrolled, supply the 6-digit Google Authenticator code.
3. Once authenticated, teachers can:
   - Grade student assignments and publish scores.
   - View faculty announcements and student attendance rosters.
   - Inspect read-only SOC activity telemetry.

### 4.4 Logging In as an Administrator
1. Enter `ayanaptechh@gmail.com` and `Techwiz2254@`.
2. Complete Step 2 (WhatsApp OTP challenge).
3. If 2FA is enabled, complete Step 3 (TOTP Authenticator challenge).
4. Full administrative capabilities are unlocked:
   - **User Management**: Lock/unlock accounts, ban/unban users, reset 2FA keys, change passwords.
   - **Session Manager**: View all active concurrent sessions with IP, user-agent, and remote termination buttons.
   - **SOC Audit Logs**: Searchable, filterable security events with CSV and JSON data export.
   - **Test Matrix**: Automated execution of 12+ real-world cybersecurity penetration test vectors.
   - **Comparison Benchmarks**: Empirical latency and defense evaluation of authentication modes.

---

## 5. Two-Factor Authentication (2FA / TOTP) Setup Guide

Teachers and Administrators are prompted to configure hardware/software 2FA for heightened account security:

1. **Access Profile Settings**:
   - In the top navigation bar, click on your user avatar and select **"Profile"**.
2. **Initiate 2FA Enrollment**:
   - Locate the **"Two-Factor Authentication (TOTP)"** section.
   - Click **"Enable 2FA"**.
3. **Scan the QR Code**:
   - Open **Google Authenticator**, **Microsoft Authenticator**, or **Authy** on your mobile device.
   - Scan the rendered QR code (or manually input the displayed Base32 secret key).
4. **Confirm Verification Code**:
   - Enter the current 6-digit code displayed on your phone app.
   - Click **"Verify & Activate"**.
5. **Enforcement**:
   - A success alert will confirm enrollment. On subsequent logins, your account will require this rolling TOTP code in addition to your password and WhatsApp OTP.

---

## 6. Security Testing & SOC Demonstration Workflows

### 6.1 Brute-Force Password Lockout Simulation
1. On the login page, enter `student@test.local` with an incorrect password (e.g., `WrongPass1`).
2. Repeat 5 times consecutively.
3. Observe the server response: The account triggers an automated security lockout countdown.
4. Sign in as Administrator to inspect the generated `ACCOUNT_LOCKED` security event and use the **Unlock Account** button to restore access immediately.

### 6.2 Student Grievance Privacy Enforcement (RBAC)
- Student support tickets and complaints are cryptographically isolated.
- Teachers attempting to access `/api/portal/tickets` or `/tickets` receive an explicit `HTTP 403 Forbidden` response.
- Only the ticket owner (the Student) and the authorized Administrator can view and respond to student inquiries.

### 6.3 Test Matrix Automated Auditing
1. Navigate to **Test Matrix** from the Admin navigation.
2. Click **"Run Full Security Matrix"**.
3. The platform executes live automated tests verifying:
   - SQL Injection immunity.
   - Timing-safe password verification.
   - Rate limiting on OTP dispatch.
   - Token revocation upon session termination.
   - Anti-replay validation on expired OTP tokens.

---

## 7. Troubleshooting & FAQs

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **"OTP code not received"** | WhatsApp/SMTP credentials not supplied in `.env`. | Open the **Lab Inspector Drawer** (terminal icon at bottom-right) to view intercepted demo OTP codes in real time. |
| **"Account Locked Out"** | 5 consecutive invalid login attempts. | Wait for the 15-minute lockout timer to expire, or log in as Administrator and click **Unlock Account** in User Management. |
| **"Invalid Authenticator Code"** | Device clock drift or replay attempt. | Ensure your mobile device time is set to "Automatic / Network Provided". Each code is valid for 30 seconds and cannot be reused. |
| **"403 Forbidden Access Denied"** | Attempting an action unauthorized for your role. | Verify your signed-in role. Faculty cannot view Student complaints; Cadets cannot access SOC audit logs. |
| **"Resetting Demo State"** | Demo data altered during testing. | Click the **"Reset Demo"** button in the Admin navigation, or restart the server process to restore default database seeds. |

---
*AuthShield 360 is developed and maintained by the Nexcyber Core Security Research Team: Ayan Khan, Yasir Khan, M. Alwaz, and Tayyaba Shahzad.*
