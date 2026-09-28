# AuthShield 360 User Guide

AuthShield 360 is an educational identity-security lab. It demonstrates role-based portals, password and OTP sign-in, session controls, audit events, and security test scenarios using fictional school records.

## Start the application

1. Ask the project administrator for the local demo URL, or follow the setup in the [Developer Guide](README_DEVELOPER.md).
2. Open the home page and choose **Login**.
3. Choose a demo account or enter credentials supplied by your administrator.

The seeded demo accounts are:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@test.local` | `Student@123` |
| Teacher | `teacher@test.local` | `Teacher@123` |
| Administrator | `ayanaptechh@gmail.com` | `Techwiz2254@` |

These are public lab credentials, not secure account credentials. Never reuse them outside this demo. The seeded users and application data are recreated when the server starts; changes made during a session are not durable.

## Sign-in and verification

The administrator always completes both the mobile OTP and email OTP steps. Student and teacher OTP requirements depend on the selected global authentication mode:

| Mode | Student / Teacher | Administrator |
| --- | --- | --- |
| Password Only | Password only | Password, mobile OTP, then email OTP |
| Password + Mobile OTP | Password, then mobile OTP | Password, mobile OTP, then email OTP |
| Password + Mobile OTP + Email | Password, mobile OTP, then email OTP | Password, mobile OTP, then email OTP |

The application starts in **Password Only** mode. Change the mode from the authentication-mode selector in the portal navigation when demonstrating the other scenarios. A mode change applies globally to subsequent sign-ins. An already authenticated session is not retroactively re-verified.

OTP codes expire after the configured interval (five minutes by default) and the resend control enforces a cooldown. If delivery providers are not configured, the app records OTP dispatches in its lab inspection stream so local demonstrations can continue. Do not expose that stream outside a trusted local lab: it contains plaintext demo OTP codes.

## Portal areas

Available navigation depends on the signed-in role:

- **Student:** academic dashboard, schedule, coursework, attendance, grades, library, announcements, and profile.
- **Teacher:** faculty overview, coursework evaluation, assigned students, gradebook, and profile.
- **Administrator:** administration overview, user directory, active sessions, institutional reports, support tickets, and profile.

Some role-specific sections are represented as dashboard sections rather than separate pages. A role that does not have permission for a protected area sees an access-denied view; server API requests are also checked against the user's role.

## Security lab workflows

1. **Compare authentication modes:** sign in, select a mode in the navigation, sign out, then sign in again with a student or teacher account to observe the required factors. Admin always uses both OTP steps.
2. **Review test cases:** sign in as the administrator and open **Test Matrix**. Run a single test or the full matrix and review the recorded result/evidence. Tests can modify seeded lab state.
3. **Compare benchmarks:** use **Comparison** to view the authentication scenarios and run the benchmark as an administrator.
4. **Review activity:** teachers and administrators can view audit logs. Administrators can additionally export logs and inspect reports, alerts, and active sessions.
5. **Manage accounts and sessions:** administrators can create/update or restrict users, unlock accounts, revoke sessions, and review support tickets.
6. **Submit a support request:** use the support/appeal form on the sign-in screen for account or MFA issues. Administrators review submitted tickets in **Support & Inquiries**.

Use **Logout** when finished. Administrators should use demo records only; actions such as changing roles, banning users, or running test cases alter the current in-memory lab state.

## Troubleshooting

- **OTP did not arrive:** check whether UltraMsg or Gmail SMTP is configured. For a local demo without provider credentials, use the lab inspection stream.
- **OTP expired or resend is blocked:** request a new OTP after the displayed expiry/cooldown; each OTP is single-use.
- **Account is locked:** wait for the configured lockout period or ask an administrator to unlock the demo account.
- **A page is denied:** verify that the signed-in account has the required role; sign out and use the correct demo account.
- **Demo data changed unexpectedly:** restart the server to reseed the in-memory database. This clears all runtime changes and sessions.

## Important safety note

This app is a local educational demonstration, not a production-ready identity provider. It uses seeded credentials, in-memory data, and a plaintext OTP inspection facility for labs. Do not put real personal data, real credentials, or a public-facing production workload on it.