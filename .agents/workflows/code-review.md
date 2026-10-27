# Reusable Workflow: Evidence-Based Code Review

**Pattern:** Formal Quality & Security Review  
**Goal:** Deliver rigorous, reproducible code reviews that catch subtle regressions, security flaws, and architectural deviations.

---

## Step 1: Context & Invariant Verification
1. Understand the purpose of the PR or commit range:
   - Does this change adhere to Owino/FairShare domain rules?
   - Does it preserve zero-sum financial balance conservation?
   - Does it preserve dual-mode parity (monolith + microservices)?

---

## Step 2: Static Analysis & Type Checking
1. Run linting across the monorepo:
   ```bash
   npm run lint
   ```
2. Run TypeScript compiler type checks:
   ```bash
   cd client && npx tsc --noEmit
   cd server && npx tsc --noEmit
   ```
3. Flag any use of `any`, `@ts-ignore`, or unvalidated type assertions as code review issues.

---

## Step 3: Security & Authorization Audit
1. Verify authorization checks on every modified route:
   - Does it verify `req.user.id` against entity ownership or group membership?
   - Are IDs checked for cross-tenant access (IDOR)?
2. Check for secret leakage:
   - No hardcoded keys, URLs with embedded credentials, or PEM certificates.
3. Validate database interactions:
   - Parameterized queries only.
   - Transactional safety for multi-table updates.

---

## Step 4: Performance & Minimalism Audit
1. Evaluate against the `ponytail-minimalism` skill:
   - Did the author introduce an unnecessary npm package?
   - Can this code be simplified or reduced in size?
   - Are database queries efficient, or is there an N+1 query loop?
2. Verify indexing:
   - Are foreign key queries backed by Prisma `@@index` annotations?

---

## Step 5: Deliver Formal Review Report
- Structure findings using the 4 Evidence Pillars (`code-review-evidence` skill):
  1. Exact File & Line.
  2. Reproduction or Trigger Scenario.
  3. Violated Standard or Invariant.
  4. Tested Remediation Code Snippet.
- State clear verdict: **APPROVE**, **REQUEST CHANGES**, or **COMMENT**.
