# Reusable Workflow: Security & Dependency Audits

**Pattern:** DevSecOps Shift-Left Security Verification  
**Goal:** Detect vulnerabilities, outdated dependencies, secret leaks, and OWASP Top 10 risks across client and server.

---

## Step 1: Secret Detection & Sensitive Asset Scan
1. Scan the repository for uncommitted or committed credentials:
   - Run GitLeaks scan:
     ```bash
     gitleaks detect --verbose --no-git
     ```
2. Manually verify high-risk patterns:
   - Check `.gitignore` contains `*.pem`, `*.key`, `.env*` (except `.env.example`).
   - Check `docker-compose*.yml` for hardcoded production database passwords or Supabase service keys.
   - Flag any secret found as **CRITICAL BLOCKER**.

---

## Step 2: Dependency Vulnerability Audit (SCA)
1. Run npm audit across the monorepo:
   ```bash
   cd client && npm audit --audit-level=high
   cd ../server && npm audit --audit-level=high
   ```
2. For identified vulnerabilities:
   - Evaluate exploitability in Owino's context.
   - Run `npm audit fix` for non-breaking patch updates.
   - For breaking changes, create an isolated upgrade plan with full test verification.

---

## Step 3: Filesystem & Container Security Scan
1. If Trivy is installed:
   ```bash
   trivy fs --severity HIGH,CRITICAL .
   ```
2. Inspect Dockerfiles (`client/Dockerfile`, `server/Dockerfile`):
   - Confirm multi-stage builds are used to minimize final container image size.
   - Confirm containers run as a non-root user (`USER node`).
   - Verify minimal base images (`alpine` or `distroless`).

---

## Step 4: OWASP Financial Logic Audit
1. Execute the `owasp-security-audit` skill:
   - Test IDOR on group and expense routes.
   - Test rate limiting bypass using proxy header manipulation (`X-Forwarded-For`).
   - Confirm all Zod schemas reject extraneous properties (`strip` or `strict`).

---

## Step 5: Deliverables
- **Expected Output:**
  - DevSecOps Audit Report detailing detected vulnerabilities, CWE mappings, and remediation status.
  - Zero critical/high CVEs in active production dependencies.
