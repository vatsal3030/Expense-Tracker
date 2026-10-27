---
name: owasp-security-audit
description: >-
  Executes structured OWASP security plays and vulnerability assessments for FinTech endpoints,
  authentication, authorization (IDOR), secret detection, and input validation.
---

# OWASP Financial Security Engineering Skill

Follow these structured procedures adapted from the OWASP Secure Agent Playbook to evaluate code for security weaknesses.

## Play 1: Authentication & Session Verification (ASVS V2)
1. **Token Inspection:**
   - Verify JWT signatures using secure algorithms (HS256/RS256 with strong secret).
   - Ensure expiration (`exp`) and not-before (`nbf`) claims are strictly enforced.
   - Confirm invalid tokens return `401 Unauthorized` without leaking stack traces.
2. **Cache Security:**
   - In `server/src/middleware/auth.ts`, verify that the in-memory token cache purges expired sessions and does not share session objects between tenants.

## Play 2: Broken Object-Level Authorization / IDOR (ASVS V4 / API1:2023)
1. For any route accepting entity IDs (`/api/groups/:id`, `/api/expenses/:id`, `/api/settlements/:id`):
   - Confirm the query filters by `userId` or checks active membership in `group_members`.
   - Never rely on the client providing `userId` in the request body; always derive identity from `req.user.id`.
2. For admin operations (`/api/admin/*` or group settings):
   - Confirm explicit role verification (`GroupMember.role === 'ADMIN'`).

## Play 3: Injection & Parameter Tampering (ASVS V5)
1. **Prisma Queries:**
   - Inspect all database calls: ensure only parameterized query objects are used.
   - If raw SQL (`$queryRaw`) is used, verify parameters are passed as tagged template literals, never string concatenation.
2. **Numeric Validation:**
   - Amounts must be positive (`amount > 0`).
   - Validate split percentages sum to exactly 100.
   - Enforce maximum limits on expense descriptions and notes to avoid buffer exhaustion.

## Play 4: Secret & Credential Detection
1. Scan for hardcoded keys:
   - Supabase keys (`sb_publishable_...`, `sb_secret_...`)
   - Database connection strings (`postgres://...`)
   - Private keys (`BEGIN RSA PRIVATE KEY`, `BEGIN PRIVATE KEY`)
2. Flag any hardcoded secret as **CRITICAL SEVERITY** with immediate remediation instructions.
