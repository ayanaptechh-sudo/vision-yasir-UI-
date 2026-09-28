# AuthShield 360 Developer Guide

## Overview

AuthShield 360 is a TypeScript application with a React 19/Vite frontend and an Express API. The API and Vite middleware run in the same Node process in development. There is no external database configured: `server/database/db.ts` implements Mongo-like in-memory collections and seeds demo users, settings, and sample school data at startup. Runtime changes are lost when the process stops.

## Prerequisites and local setup

- Node.js 20.19+ or 22.12+ (Vite 8 supported Node versions)
- npm

From the repository root:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:3000`. `PORT` can be set in `.env` to use another port. The development script is `tsx server.ts`; `server/app.ts` mounts `/api` routes and Vite middleware. Set `DISABLE_HMR=true` to disable Vite HMR/file watching in environments that need it.

## NPM scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the full-stack development server. |
| `npm run lint` | Run the TypeScript compiler in no-emit mode (`tsc --noEmit`). |
| `npm run build` | Build the frontend with Vite and bundle the Express server to `dist/server.js`. |
| `npm start` | Run `server.ts`; when a production bundle exists it loads `dist/server.js`. |
| `npm run preview` | Start Vite's static preview server for the frontend build. |

There is no separate automated test script in `package.json`. The app's **Test Matrix** is an administrator-operated runtime security demonstration, not a unit/integration test runner for the codebase.

## Environment configuration

Copy `.env.example` to `.env`. Keep real secrets out of source control and never put provider credentials in frontend code.

| Variable | Purpose |
| --- | --- |
| `PORT` | Express listen port; defaults to `3000`. |
| `NODE_ENV` | Set to `production` to serve built static assets instead of Vite middleware. |
| `DISABLE_HMR` | Set to `true` to disable Vite HMR/file watching. |
| `ULTRAMSG_INSTANCE_ID`, `ULTRAMSG_TOKEN` | Optional WhatsApp OTP gateway credentials. |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Optional Gmail SMTP credentials for email OTP. `SMTP_USER` and `SMTP_PASS` are supported as aliases. |

When provider credentials are absent, OTP generation continues in local lab mode and records dispatch information in the in-memory test-dispatch stream. `SESSION_SECRET`, OTP/session/lockout values, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and `GEMINI_API_KEY` are present in the example environment file but are not currently read by the server implementation. OTP expiry, failed-login threshold, lockout duration, and session timeout are currently seeded in `db.ts` and can be changed through administrator settings where exposed.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Public/login routing and authenticated role-based page selection. |
| `src/pages/` | Student, teacher, administrator, audit, reports, sessions, tickets, and test views. |
| `src/components/` | Shared navigation, portal layout, OTP inspection drawer, badges, and modals. |
| `src/context/AuthContext.tsx` | Frontend auth/session state and API-backed operations. |
| `src/services/api.ts` | Browser API client; sends the bearer and `x-session-token` headers. |
| `server.ts` | Development/production server bootstrap. |
| `server/app.ts` | Express setup, API mount, health endpoints, and Vite/static hosting. |
| `server/routes/api.ts` | API endpoint registration and route-level role middleware. |
| `server/controllers/` | Authentication, administration, portal, logs, comparison, and test-matrix handlers. |
| `server/middleware/auth.ts` | Session validation and role authorization. |
| `server/database/db.ts` | In-memory collections, default settings, demo accounts, and seed records. |
| `server/services/` | OTP, audit, email, and UltraMsg dispatch logic. |

## Authentication and authorization behavior

- Authentication modes are `PASSWORD_ONLY`, `PASSWORD_OTP`, and `PASSWORD_OTP_EMAIL`; the default is `PASSWORD_ONLY`.
- Administrators always require password, mobile OTP, and email OTP, regardless of the global mode.
- Teachers require mobile OTP in `PASSWORD_OTP` and `PASSWORD_OTP_EMAIL`; students require it only in those modes.
- In `PASSWORD_OTP_EMAIL`, a verified mobile OTP is followed by email OTP for non-admin roles as well.
- The default seeded administrator is `ayanaptechh@gmail.com`; lab accounts are `student@test.local` and `teacher@test.local`. Passwords and seed details are defined in `server/database/db.ts`; treat them as demo-only.
- API authorization is enforced on the server with `authenticateSession` and `requireRole`. Keep authorization checks server-side even when a page is hidden or disabled in React.
- Passwords use Node `scrypt`; OTP values are stored as salted hashes and compared with a timing-safe comparison. Session tokens are random, server-validated records; the browser stores its token in `localStorage`.

## API areas

All API routes are mounted under `/api` (for example, `GET /api/auth/settings`). Main route groups:

- `/auth`: settings, mode selection, password/OTP login, resend, logout, current session, and password recovery.
- `/admin`: user and system administration, sessions, tickets, alerts, reports, and demo reset. Most operations require the administrator role.
- `/logs`: audit log and metrics; log export requires administrator role.
- `/matrix` and `/comparison`: read scenario data; running tests/benchmarks requires administrator role.
- `/portal`: student/teacher resources with server-side role checks.
- `/support/submit`: public support-ticket submission.
- `/healthz` and `/api/health`: health responses.

See `server/routes/api.ts` for the current request paths and role requirements. The browser client uses relative `/api` paths, so frontend and API are expected to be served from the same origin.

## Development and verification

1. Keep UI changes in the relevant page/component and API calls in `src/services/api.ts` / `AuthContext.tsx`.
2. Put business logic in the owning server controller/service and register new endpoints in `server/routes/api.ts`.
3. Add or preserve server-side role checks for protected operations.
4. Run `npm run lint` after TypeScript changes and `npm run build` to verify both frontend and server bundling.
5. For behavioral checks, use the local app and administrator Test Matrix. Avoid treating its results as a substitute for automated code tests.

## Lab-only limitations

This is a demonstration, not a production identity service. The database and sessions are in memory, seed credentials are known, and the OTP inspection API/UI intentionally exposes codes to support isolated evaluation. Do not deploy it on an untrusted network or use real account data. Before any production adaptation, replace the storage/session design, remove or tightly gate OTP inspection and lab controls, secure configuration changes, and perform a dedicated security review.