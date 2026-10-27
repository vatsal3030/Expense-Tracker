# Reusable Workflow: Systematic Debugging

**Pattern:** 5-Step Fault Isolation & Root-Cause Resolution  
**Goal:** Isolate and resolve complex defects without regressions or trial-and-error guessing.

---

## Step 1: Capture & Reproduce
1. Document the failure symptom:
   - Reproduction URL or API route.
   - HTTP method and request body/headers.
   - Exact error message, HTTP status, and stack trace.
2. Craft a standalone reproduction test case or command that triggers the bug reliably on demand.

---

## Step 2: Trace Across System Boundaries
1. Check each tier sequentially to identify where the failure originates:
   - **Client Console / Network Tab:** Did the client send the correct payload? Was the response parsed correctly?
   - **Gateway / NGINX:** Did NGINX forward the request to the correct upstream? Was there a proxy timeout (504) or bad gateway (502)?
   - **Express Route & Middleware:** Did rate-limiting block it (429)? Did auth fail (401)? Did Zod validation reject the schema (400)?
   - **Prisma & Database:** Did the database query throw a constraint violation (P2002) or connection pool timeout (P2024)?
   - **Cache Tier:** Is stale Redis/L1 cache returning expired data?

---

## Step 3: Isolate Root Cause & State Hypotheses
1. Formulate at least two clear hypotheses explaining the root cause.
2. Inspect log outputs and state variables to confirm or refute each hypothesis.
3. Distinguish between the **trigger** (what made the bug visible) and the **root cause** (the flawed invariant).

---

## Step 4: Apply Minimal Surgical Fix
1. Apply the fix strictly at the point of origin.
2. Keep the change minimal according to `ponytail-minimalism`.
3. Do not apply secondary cosmetic edits in the same diff.

---

## Step 5: Verify & Prevent Regressions
1. Re-run the reproduction test: verify it now passes.
2. Run full regression tests: verify no existing features broke.
3. Check in the regression test alongside the code fix.
- **Expected Output:** Documented incident post-mortem with Root Cause Analysis (RCA), code diff, and passing test evidence.
