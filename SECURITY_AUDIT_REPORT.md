# 🛡️ Owino (FairShare) SaaS Security Audit Report
**Date:** November 12, 2026  
**Auditor:** Senior Application Security Engineer & SaaS Security Architect  
**Target Application:** Owino / FairShare SaaS (Next.js 16 + Node.js Express Dual-Parity Architecture)  
**Status:** Audit Completed — Pre-Remediation Phase  

---

## 1. Executive Summary

A comprehensive security audit of the Owino (FairShare) expense sharing and debt minimization SaaS platform was performed across all 19 defined SaaS security dimensions and OWASP Top 10 / OWASP API Security Top 10 standards.

The application demonstrates strong foundational controls:
- **Zero Raw SQL Injections:** 100% of database interactions are managed via Prisma ORM parameterized queries.
- **Fail-Safe Error Handling:** Production error middleware (`errorHandler.ts`) rigorously suppresses internal exceptions, stack traces, and database schemas.
- **Robust Cryptography:** Bcrypt hashing with high salt rounds for protected group passcodes and secure JWT validation.
- **Minimal Surface Attack Vectors:** No unvalidated binary file storage or public bucket uploads.

However, several critical and high-severity authorization, authentication, and privacy flaws were identified that require immediate remediation before scaling in production:
1. **Critical/High IDOR on Expense and Settlement Creation:** Authenticated users can inject unauthorized expenses and fake settlements into private groups they do not belong to.
2. **Critical/High IDOR on Financial Export Reports:** Any authenticated user can export full itemized financial reports and participant emails for arbitrary private groups.
3. **High WebSocket Authorization Bypass:** Connected clients can join arbitrary private user and group rooms without authentication, leaking real-time financial events.
4. **High PII Exposure:** User search leaks plain text phone numbers and emails to any authenticated user.
5. **High Privilege Escalation Risk:** Insecure fallback admin email configuration opens superuser access if environment variables are omitted.
6. **Medium Credential Stuffing Vector:** Authentication endpoints lack strict, dedicated brute-force rate limiters.
7. **Medium Unauthenticated Cron Execution:** Global recurring expense processing endpoint is accessible to any standard authenticated user.

---

## 2. Universal 19-Point Audit Status Matrix

| # | Security Requirement | Audit Status | Primary Location / Evidence | Severity |
|---|----------------------|--------------|------------------------------|----------|
| 1 | Row-Level Security & Data Isolation | ⚠️ Vulnerable | `server/src/routes/expense.routes.ts`, `settlement.routes.ts` | **HIGH** |
| 2 | Authentication on Every Protected API | ⚠️ Partially Implemented | Protected via JWT; `POST /api/recurring/process` missing role | **MEDIUM** |
| 3 | Never Trust the Frontend | ⚠️ Vulnerable | Group membership assumed on expense creation | **HIGH** |
| 4 | Rate Limiting & Abuse Prevention | ⚠️ Partially Implemented | Global 2500 req/15min exists; Auth endpoints lack strict limit | **MEDIUM** |
| 5 | Input Validation & Sanitization | ✅ Secure | Zod schemas on controllers; CSV formula escaping verified | **INFO** |
| 6 | Safe Database Queries | ✅ Secure | 100% Prisma ORM parameterized queries; zero `$queryRaw` | **INFO** |
| 7 | CORS & Cross-Origin Security | ✅ Secure | Explicit origin restriction to client domain; credentials true | **INFO** |
| 8 | HTTPS & Secure Transport | ⚠️ Partially Implemented | TLS 1.2/1.3 terminated via Let's Encrypt; missing HSTS header | **LOW** |
| 9 | IDOR & Object-Level Authorization | ⚠️ Vulnerable | Missing group membership check in `POST /expenses`, `POST /settlements`, `GET /export/report` | **HIGH** |
| 10 | Production Debugging & Errors | ✅ Secure | `errorHandler.ts` masks internal details in production | **INFO** |
| 11 | Administrative Audit Logging | ⚠️ Partially Implemented | `activity` logs user events; admin user status toggle unlogged | **MEDIUM** |
| 12 | Private Storage & File Access | ✅ Secure / N/A | No binary file storage; CSV parsed strictly client-side | **INFO** |
| 13 | Admin & Privileged Access Security | ⚠️ Vulnerable | Hardcoded fallback admin emails in `admin.routes.ts` & `user.routes.ts` | **HIGH** |
| 14 | Dependency & Supply Chain Security | ✅ Secure | `npm audit` returned 0 vulnerabilities in workspace | **INFO** |
| 15 | Secure File Uploads | ✅ Secure / N/A | Memory-only client-side CSV parsing; strict schema validation | **INFO** |
| 16 | Independent Security Review | ⚠️ Vulnerable | WebSocket room eavesdropping; FX rates SSRF parameter injection | **HIGH** |
| 17 | HTTP Security Headers | ⚠️ Partially Implemented | Helmet & Next.js headers active; NGINX gateway lacks HSTS | **LOW** |
| 18 | Sensitive Data Exposure & Logging | ⚠️ Vulnerable | `GET /api/users/search` leaks email and phone numbers | **HIGH** |
| 19 | Idempotency & Financial Concurrency | ✅ Secure | `Idempotency-Key` supported; chunked atomic Prisma transactions | **INFO** |

---

## 3. Deep-Dive Vulnerability Findings

### FINDING 01: [HIGH] Broken Object-Level Authorization (IDOR) on Expense Creation
- **File:** `server/src/routes/expense.routes.ts#L80-L95`
- **CWE:** CWE-639 / OWASP API1:2023
- **Description:** When an expense is created with `groupId`, the handler verifies that `paidById` is a member of the group, but **does not verify whether `req.user.id` (the caller) is an active member of `groupId`**, nor does it verify that all members in `shares` are members of `groupId`.
- **Proof of Concept:**
  1. Attacker registers account `userA`.
  2. Attacker discovers or guesses private `groupId` belonging to `userB` and `userC`.
  3. Attacker posts `POST /api/expenses` with `groupId`, `paidById: userB.id`, `shares: [{ userId: userB.id, amount: 500 }]`.
  4. The server creates the expense inside `userB`'s private group without verifying `userA`'s group membership.
- **Impact:** Malicious users can fabricate expenses, corrupt financial balances, or harass private groups.
- **Remediation:** Verify that `req.user.id` is an active member of `groupId` and ensure all user IDs in `shares` belong to `group_members`.

---

### FINDING 02: [HIGH] Broken Object-Level Authorization (IDOR) on Settlement Creation
- **File:** `server/src/routes/settlement.routes.ts#L43-L60`
- **CWE:** CWE-639 / OWASP API1:2023
- **Description:** When recording a settlement with `groupId`, the handler does not verify whether `payerId`, `payeeId`, or `req.user.id` are active members of `groupId`.
- **Proof of Concept:**
  1. User A initiates `POST /api/settlements` with `groupId: targetGroupId`, `payerId: userB.id`, `payeeId: userA.id`, `amount: 1000`.
  2. The settlement is recorded against `targetGroupId`, distorting the group's debt simplification balance graph.
- **Impact:** Graph minimization calculation corruption and falsified debt clearance.
- **Remediation:** Check `groupMember` membership for both `payerId` and `payeeId` when `groupId` is provided.

---

### FINDING 03: [HIGH] Broken Object-Level Authorization (IDOR) on Financial Export Reports
- **File:** `server/src/routes/export.routes.ts#L172-L182`
- **CWE:** CWE-639 / OWASP API1:2023 / OWASP API3:2023
- **Description:** `GET /api/export/report` accepts `?groupId=...`. When `groupId` is supplied, `whereClause.groupId = groupId` is executed without verifying if `req.user.id` is a member of that group.
- **Proof of Concept:**
  1. User A makes request: `GET /api/export/report?groupId=victims-group-id`.
  2. Server returns all expenses, participant full names, emails, amounts, categories, and monthly breakdowns for that group.
- **Impact:** Complete confidentiality breach of group financial records and participant PII.
- **Remediation:** Query `prisma.groupMember.findFirst({ where: { groupId, userId: req.user.id } })` and reject with `403 Forbidden` if not a member.

---

### FINDING 04: [HIGH] Broken WebSocket Authentication & Real-time Eavesdropping
- **File:** `server/src/lib/socket.ts#L18-L35`
- **CWE:** CWE-306 / OWASP API2:2023
- **Description:** Socket.IO server allows any client connection to join arbitrary rooms via `socket.on('join:user', userId)` and `socket.on('join:group', groupId)` without verifying authentication tokens or group permissions.
- **Proof of Concept:**
  1. An attacker connects via WebSocket and emits `join:user`, passing a target user's UUID.
  2. The server adds the attacker's socket to `user:${targetUserId}`.
  3. Whenever a payment, debt settlement, or notification occurs for the victim, the server broadcasts the event directly to the attacker.
- **Impact:** Real-time surveillance of user transactions and private notifications.
- **Remediation:** Implement Socket.IO handshake authentication middleware with JWT verification, bind `socket.data.userId`, and verify group membership before allowing room joins.

---

### FINDING 05: [HIGH] Excessive PII Disclosure via User Search Endpoint
- **File:** `server/src/routes/user.routes.ts#L243-L255`
- **CWE:** CWE-200 / OWASP API3:2023
- **Description:** `GET /api/users/search?q=...` returns raw `phone` and `email` fields for all matching users across the platform.
- **Proof of Concept:**
  1. Attacker sends requests with common names or phone fragments (e.g. `GET /api/users/search?q=a`).
  2. Server returns list of users with unmasked email addresses and phone numbers.
- **Impact:** Phone number harvesting, spam targeting, and data protection regulatory non-compliance.
- **Remediation:** Mask phone numbers (e.g. `+91 ******1234`) and return only public profile fields (`id`, `name`, `avatarUrl`, masked identifier).

---

### FINDING 06: [HIGH] Insecure Hardcoded Fallback for Administrator Privileges
- **File:** `server/src/routes/admin.routes.ts#L11`, `server/src/routes/user.routes.ts#L34`
- **CWE:** CWE-798 / OWASP A07:2021
- **Description:** Admin authorization middleware uses fallback string `'rajkotgamer74@gmail.com,vatsalvadgama30@gmail.com,admin@fairshare.com'` if `ADMIN_EMAILS` environment variable is unset.
- **Proof of Concept:**
  1. If `ADMIN_EMAILS` is omitted or stripped during environment deployment, any user who registers `admin@fairshare.com` or has that email will receive full platform admin privileges.
- **Impact:** Complete administrative account takeover and privilege escalation.
- **Remediation:** Remove fallback string; enforce strict `process.env.ADMIN_EMAILS` with empty set fallback if unset.

---

### FINDING 07: [MEDIUM] Missing Dedicated Rate Limiting on Authentication Endpoints
- **File:** `server/src/index.ts#L70-L78`, `server/src/services/base.service.ts#L70-L78`
- **CWE:** CWE-307 / OWASP API4:2023
- **Description:** `/api/auth/login` and `/api/auth/signup` only share the global 2,500 requests / 15 min limiter, permitting brute-force password guessing and credential stuffing attacks.
- **Impact:** Account takeover via automated dictionary attacks.
- **Remediation:** Add a strict auth limiter (15 requests per 15-minute window per IP) applied directly to `/api/auth/login`, `/api/auth/signup`, and `/api/auth/reset-password`.

---

### FINDING 08: [MEDIUM] Unrestricted Execution of Global Recurring Expense Cron Endpoint
- **File:** `server/src/routes/recurring.routes.ts#L217-L230`
- **CWE:** CWE-862 / OWASP API5:2023
- **Description:** `POST /api/recurring/process` processes recurring expenses across the entire database for all users, but is protected only by general user authentication (`authenticate`), allowing any standard user to trigger recurring runs repeatedly.
- **Impact:** Denial of Service through resource-intensive database aggregation or unexpected duplicate processing attempts.
- **Remediation:** Require a dedicated internal CRON secret header (`X-Cron-Secret`) matching `process.env.CRON_SECRET` or require administrative role.

---

### FINDING 09: [MEDIUM] Missing Administrative Audit Trail for User Status Modification
- **File:** `server/src/routes/admin.routes.ts#L194-L218`
- **CWE:** CWE-778 / OWASP A09:2021
- **Description:** `PATCH /api/admin/users/:id/toggle-status` changes a user's active/suspended state without logging an activity entry or administrative audit event.
- **Impact:** Lack of non-repudiation and traceability during administrative investigations.
- **Remediation:** Record an `ADMIN_ACTION` entry in `prisma.activity` capturing the admin actor ID, target user ID, previous status, and new status.

---

### FINDING 10: [LOW] Unvalidated External Currency Query Parameter (SSRF Hardening)
- **File:** `server/src/routes/fx.routes.ts#L31-L45`
- **CWE:** CWE-918 / OWASP A10:2021
- **Description:** `req.query.base` is appended directly to external API URL `https://api.frankfurter.app/latest?from=${base}` without validating that `base` is in `SUPPORTED_CURRENCIES`.
- **Impact:** Potential URL manipulation or unwanted outbound requests to external API.
- **Remediation:** Validate that `base` is in `SUPPORTED_CURRENCIES` before issuing external HTTP request.

---

### FINDING 11: [LOW] Missing Strict-Transport-Security (HSTS) Header at NGINX Gateway
- **File:** `nginx/nginx.conf#L38-L47`
- **CWE:** CWE-523 / OWASP A05:2021
- **Description:** NGINX handles TLS termination but does not send the `Strict-Transport-Security` header.
- **Impact:** Users could be subject to SSL stripping attacks on initial plaintext requests.
- **Remediation:** Add `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;` to NGINX SSL server block.

---

## 4. Remediation Plan & Execution Sequence

1. **Sprint 1 (Critical & High IDOR / Auth Hardening):**
   - Fix IDOR in `server/src/routes/expense.routes.ts` (`POST /api/expenses`).
   - Fix IDOR in `server/src/routes/settlement.routes.ts` (`POST /api/settlements`).
   - Fix IDOR in `server/src/routes/export.routes.ts` (`GET /api/export/report`).
   - Secure WebSocket connection & room joining in `server/src/lib/socket.ts`.
2. **Sprint 2 (PII & Privilege Escalation Hardening):**
   - Mask sensitive fields in `server/src/routes/user.routes.ts` (`/search`).
   - Eliminate hardcoded admin fallback emails in `admin.routes.ts` and `user.routes.ts`.
   - Protect `POST /api/recurring/process` with CRON secret / admin verification.
3. **Sprint 3 (Rate Limiting, Audit Logging & Network Headers):**
   - Implement strict auth rate limiter (15 req / 15 min) on login/signup in `server/src/index.ts` and `base.service.ts`.
   - Add admin audit trail logging in `server/src/routes/admin.routes.ts`.
   - Validate currency parameter in `server/src/routes/fx.routes.ts`.
   - Add HSTS and secure headers to `nginx/nginx.conf`.
4. **Sprint 4 (Testing & Verification):**
   - Run TypeScript typechecks across client and server.
   - Run test suites and verify dual-parity compatibility (Monolith + Microservices).
   - Document results in `SECURITY_IMPLEMENTATION_REPORT.md`.
