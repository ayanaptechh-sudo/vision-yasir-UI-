# AuthShield 360 — Developer & Architecture Guide
> **VerifyVault: Technical Specification, API Reference & System Internals**  
> *Full-Stack Zero-Trust Identity Verification Engine (React 19 + TypeScript + Express + Vite)*

![AuthShield System Architecture](/images/authshield_architecture.jpg)

---

## 1. System Overview & Technical Stack

**AuthShield 360** is engineered as a monolithic, zero-external-dependency full-stack application. It pairs an Express.js backend API with a React 19 single-page application (SPA), bundled and hosted seamlessly via Vite middlewares in development and pre-compiled static assets in production.

### Core Technology Stack:
- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS, Lucide React, Three.js / React Three Fiber (3D Sentinel model).
- **Backend**: Node.js 22, Express 4.x, TypeScript (`tsx` engine).
- **Cryptography & Hashing**:
  - Node.js native `crypto.scrypt` with 16-byte random salts for password storage.
  - Native HMAC-SHA1 for RFC 6238 Time-based One-Time Passwords (TOTP).
  - AES-256-GCM authenticated encryption for secret keys at rest.
  - Native `crypto.timingSafeEqual` for constant-time cryptographic hash verification.
- **Database**: In-memory high-performance document store (`server/database/db.ts`) simulating MongoDB query semantics with synchronous indexing.
- **Delivery Providers**:
  - WhatsApp OTP: UltraMsg REST API Gateway (`server/services/ultraMsgService.ts`).
  - Email OTP: Nodemailer SMTP with Gmail App Password support (`server/services/emailService.ts`).

---

## 2. Cryptographic Architecture & Security Implementation

![AuthShield Auth Flow](/images/authshield_auth_flow.jpg)

### 2.1 RFC 6238 TOTP Engine (`server/services/cryptoService.ts`)
The application implements an independent, standard-compliant RFC 6238 TOTP generator and validator:
1. **Secret Generation**: Produces 20 cryptographically secure pseudorandom bytes encoded into RFC 4648 Base32.
2. **HMAC-SHA1 Computation**:
   - Calculates the current 30-second time counter: $T = \lfloor \frac{\text{unix\_time}}{30} \rfloor$.
   - Converts counter $T$ into an 8-byte big-endian buffer.
   - Computes $HMAC\text{-}SHA1(\text{Secret}, T)$.
3. **Dynamic Truncation**:
   - Takes the low-order 4 bits of the last byte to calculate the offset $O = \text{hash}[19] \ \& \ 0x0F$.
   - Extracts a 31-bit integer: $\text{binary} = ((\text{hash}[O] \ \& \ 0x7F) \ll 24) \mid ((\text{hash}[O+1] \ \& \ 0xFF) \ll 16) \mid ((\text{hash}[O+2] \ \& \ 0xFF) \ll 8) \mid (\text{hash}[O+3] \ \& \ 0xFF)$.
   - Derives the 6-digit token: $\text{OTP} = \text{binary} \pmod{10^6}$.
4. **Time-Drift Window & Replay Protection**:
   - Accepts a time skew window of $\pm 1$ step (current, $T-1$, and $T+1$).
   - Stores `lastVerifiedTotpStep` on the user record. If an incoming token matches a previously consumed step counter, it is rejected immediately to eliminate replay attacks.
5. **AES-256-GCM Encryption at Rest**:
   - All TOTP secret keys are encrypted before persistence using AES-256-GCM with a unique 12-byte initialization vector (IV) and a 16-byte authentication tag (`iv:tag:ciphertext`).

### 2.2 Password Security & Brute-Force Mitigation
- Passwords are encrypted via Node.js `crypto.scryptSync(password, salt, 64)`.
- The database stores passwords formatted as `salt:derivedKeyHash`.
- Consecutive authentication failures trigger a lockout counter (`failedLoginAttempts`). Upon reaching 5 failed attempts, `lockoutUntil` is stamped with an automatic 15-minute freeze.
- Verification uses `crypto.timingSafeEqual` to thwart timing-analysis side-channel attacks.

### 2.3 Session Fixation Defense & State Management
- Authenticating users do not inherit pre-auth session tokens.
- Upon successful authentication across all factors, old tokens are invalidated and an unguessable 64-character hexadecimal session token is issued (`crypto.randomBytes(32).toString('hex')`).
- Tokens are transmitted via `Authorization: Bearer <token>` or custom `x-session-token` headers.

### 2.4 HTTP Defense & Security Headers (`server/app.ts`)
The server enforces the following hardened security headers on every request:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 3. Repository & Directory Structure

```tree
├── package.json                 # Dependency definitions & build scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration (port 3000, React plugin)
├── server.ts                    # Server startup dispatcher (dev tsx vs prod dist)
├── index.html                   # HTML entry point with favicon suite
│
├── server/                      # Full-stack Node.js Express Backend
│   ├── app.ts                   # Express app initialization, static serving, & Vite mounting
│   ├── routes/
│   │   └── api.ts               # Protected & public API route definitions
│   ├── controllers/
│   │   ├── authController.ts    # Multi-step login, TOTP setup, password recovery, & logout
│   │   ├── adminController.ts   # User management, 2FA reset, lockouts, & support tickets
│   │   ├── portalController.ts  # Role-gated Student & Teacher academic records
│   │   ├── logsController.ts    # Audit event ingestion, telemetry streaming, & export
│   │   ├── testMatrixController.ts # 12+ automated cybersecurity penetration tests
│   │   └── comparisonController.ts # Performance & latency benchmarking engine
│   ├── middleware/
│   │   └── auth.ts              # Session validation & requireRole(roles) middleware
│   ├── database/
│   │   └── db.ts                # In-memory document database, collections, & seed records
│   └── services/
│       ├── cryptoService.ts     # RFC 6238 TOTP, QR code generation, & AES-256-GCM
│       ├── otpService.ts        # 6-digit random code generation, hashing, & expiry checks
│       ├── auditService.ts      # Structured audit trail ingestion
│       ├── ultraMsgService.ts   # WhatsApp gateway dispatch client
│       └── emailService.ts      # SMTP / Gmail email dispatch client
│
├── src/                         # Frontend React 19 Application
│   ├── main.tsx                 # DOM root mount
│   ├── App.tsx                  # Main router & role-based dashboard router
│   ├── index.css                # Tailwind CSS imports & global design tokens
│   ├── context/
│   │   └── AuthContext.tsx      # Global auth context, session state, & inspector hooks
│   ├── components/
│   │   ├── Navbar.tsx           # Main application navbar with brand emblem
│   │   ├── PortalLayout.tsx     # Authenticated shell layout, 2FA banner, & inspector
│   │   ├── InspectorDrawer.tsx  # Developer OTP inspection & telemetry slide-out
│   │   └── DemoResetModal.tsx   # Modal for resetting database seeds
│   ├── pages/
│   │   ├── HomePage.tsx         # Landing page with 3D Sentinel, disciplines, & team section
│   │   ├── LoginPage.tsx        # Multi-stage login form with demo credential pills
│   │   ├── StudentDashboard.tsx # Cadet coursework, grades, timetable, & ticket submission
│   │   ├── TeacherDashboard.tsx # Faculty student roster, submissions, & grading
│   │   ├── AdminDashboard.tsx   # SOC console, lockouts, active sessions, & system stats
│   │   ├── UserManagementPage.tsx # User CRUD, 2FA reset, & account unlocking
│   │   ├── AuditLogsPage.tsx    # Filterable audit events table with export
│   │   ├── TestMatrixPage.tsx   # Automated security test runner
│   │   ├── ComparisonPage.tsx   # Mode comparison & latency benchmarks
│   │   ├── ProfilePage.tsx      # User profile & TOTP 2FA QR code enrollment
│   │   ├── SessionsPage.tsx     # Active session revocation console
│   │   ├── TicketsPage.tsx      # Support ticket triage (strict student privacy)
│   │   └── AccessDeniedPage.tsx # 403 Forbidden interceptor
│   └── services/
│       └── api.ts               # Typed Axios/Fetch client wrapper
│
└── public/                      # Static Assets
    ├── favicon.ico              # Multi-resolution favicon icon
    ├── favicon.png              # 192x192 high-res manifest icon
    ├── favicon-32x32.png        # 32x32 browser tab icon
    ├── favicon-16x16.png        # 16x16 browser tab icon
    ├── apple-touch-icon.png     # Apple touch icon
    └── images/                  # Infographics, splash screens, & architecture diagrams
```

---

## 4. API Specification & Endpoints

All backend routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <sessionToken>` header or `x-session-token` header.

### 4.1 Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login-step1` | Public | Validates Email + Password. Enforces 5-attempt lockout threshold. |
| `POST` | `/api/auth/verify-otp` | Public | Validates 6-digit WhatsApp or Email OTP code. |
| `POST` | `/api/auth/verify-totp` | Public | Validates RFC 6238 Google Authenticator rolling code. |
| `POST` | `/api/auth/resend-otp` | Public | Resends OTP code adhering to 60-second cooldown limits. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves the current session user details and role. |
| `POST` | `/api/auth/logout` | Authenticated | Terminates session and purges token from the active session store. |
| `GET` | `/api/auth/2fa/setup` | `TEACHER`, `ADMIN` | Generates a new Base32 secret, manual key, and QR code data URL. |
| `POST` | `/api/auth/2fa/verify-setup` | `TEACHER`, `ADMIN` | Verifies the initial TOTP code to confirm and lock 2FA activation. |
| `GET` | `/api/auth/2fa/status` | Authenticated | Checks if 2FA is currently active on the requesting user account. |

### 4.2 Administration Endpoints (`/api/admin`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | `ADMINISTRATOR` | Lists all users with lockout status and 2FA states. |
| `POST` | `/api/admin/users/unlock` | `ADMINISTRATOR` | Clears failed login counter and unlocks an account. |
| `POST` | `/api/admin/users/reset-2fa` | `ADMINISTRATOR` | Resets and wipes TOTP secret for a user unable to authenticate. |
| `GET` | `/api/admin/sessions` | `ADMINISTRATOR` | Returns all active concurrent user sessions across the system. |
| `DELETE` | `/api/admin/sessions/:id` | `ADMINISTRATOR` | Remotely terminates a specific active user session. |
| `POST` | `/api/admin/demo-reset` | `ADMINISTRATOR` | Purges runtime mutations and restores factory database seeds. |

### 4.3 Portal Endpoints (`/api/portal`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/portal/student-data` | `STUDENT`, `ADMIN` | Retrieves courses, attendance, and grades for the authenticated student. |
| `GET` | `/api/portal/teacher-data` | `TEACHER`, `ADMIN` | Retrieves course submissions and student grading rosters. |
| `POST` | `/api/portal/grade-submission` | `TEACHER`, `ADMIN` | Updates an assignment grade and logs a faculty grading audit event. |
| `GET` | `/api/portal/tickets` | Role-Filtered | Fetches support tickets. Students see their own; Admins see all; Teachers receive 403. |
| `POST` | `/api/portal/tickets` | `STUDENT`, `ADMIN` | Submits a new support inquiry or account appeal. |

### 4.4 Telemetry, Logs & Security Testing
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/logs` | `TEACHER`, `ADMIN` | Retrieves real-time audit log events. |
| `GET` | `/api/logs/export` | `ADMINISTRATOR` | Streams audit logs in CSV or JSON format. |
| `GET` | `/api/matrix/scenarios` | `ADMINISTRATOR` | Fetches the full suite of security test vectors and past results. |
| `POST` | `/api/matrix/run` | `ADMINISTRATOR` | Executes automated penetration test vectors and returns cryptographic proof. |
| `GET` | `/api/comparison/benchmarks`| `ADMINISTRATOR` | Runs latency and security evaluation across all 3 auth modes. |

---

## 5. Local Setup & Build Pipeline

### Prerequisites
- Node.js 20.19+ or Node.js 22+
- npm 10+

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Launch full-stack development server
npm run dev
```
The server will bind to `http://localhost:3000`.

### Production Build & Deployment
```bash
# Build frontend with Vite & bundle Express backend with esbuild
npm run build

# Start the compiled production server
npm start
```

### NPM Script Reference
| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Starts development server with on-the-fly TS compilation and Vite HMR. |
| `npm run build` | `vite build && esbuild ...` | Compiles client to `dist/` and bundles server to `dist/server.js`. |
| `npm run lint` | `tsc --noEmit` | Runs strict TypeScript type-checking across frontend and backend. |
| `npm start` | `node server.ts` | Boots production server using compiled `dist/server.js`. |

---

## 6. Environment Variables Reference (`.env`)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `3000` | Port on which Express and Vite middleware listen. |
| `NODE_ENV` | Optional | `development` | Set to `production` for compiled static asset delivery. |
| `DISABLE_HMR` | Optional | `false` | Set to `true` to disable HMR in restricted container sandboxes. |
| `ULTRAMSG_INSTANCE_ID` | Optional | - | UltraMsg WhatsApp instance ID for live SMS/WhatsApp dispatch. |
| `ULTRAMSG_TOKEN` | Optional | - | UltraMsg API authorization bearer token. |
| `GMAIL_USER` | Optional | - | Gmail account email for live SMTP email dispatch. |
| `GMAIL_APP_PASSWORD` | Optional | - | Google 16-character App Password for SMTP authentication. |

> *Note:* In the absence of live provider credentials, the server automatically operates in local lab mode and captures all dispatches inside the in-memory **Lab Inspector Drawer**.

---
*AuthShield 360 Core Development & Research Team: Ayan Khan, Yasir Khan, M. Alwaz, and Tayyaba Shahzad.*
