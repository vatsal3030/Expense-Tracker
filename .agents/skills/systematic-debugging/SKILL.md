---
name: systematic-debugging
description: >-
  Executes a rigorous 5-step root-cause analysis procedure for debugging defects.
  Use when investigating unexpected errors, race conditions, database discrepancies,
  or failing tests in Owino/FairShare.
---

# Systematic Debugging Procedure

Never jump straight to guessing fixes. Guessing introduces regressions and wastes context tokens. Follow this structured 5-step scientific procedure:

## Step 1: Reproduce Deterministically
- Formulate the minimal reproducible scenario:
  - Exact endpoint or UI page URL
  - HTTP method, headers, and request payload
  - Expected output vs. actual observed output
- Run or craft a reproduction script/test case to confirm the failure reliably.

## Step 2: Isolate the Fault Domain
- Narrow down where the failure occurs across the system boundaries:
  - **Client:** State management, Axios response parsing, rendering logic.
  - **Gateway:** NGINX routing, header forwarding, proxy timeout, CORS block.
  - **Backend Controller:** Route parameter parsing, Zod validation rejection.
  - **Service/Algorithm:** Net balance computation, greedy minimization loop.
  - **Cache/Database:** Redis key staleness, Prisma query filter, PgBouncer pool exhaustion.

## Step 3: Formulate & Rank Hypotheses
- State at least 2 distinct hypotheses based on evidence (stack traces, server logs, Prisma query logs):
  - *Hypothesis A:* The query fails because the user is not included in the `group_members` table.
  - *Hypothesis B:* In-flight auth cache returns a stale user object after token refresh.
- Test hypotheses by inspecting code and checking variable states at runtime.

## Step 4: Implement the Minimal Surgical Fix
- Fix the root cause, not the symptom.
  - If a variable is null, determine *why* it is null rather than just wrapping it in an optional chain `?.` that masks downstream errors.
- Keep the fix minimal per the `ponytail-minimalism` skill.

## Step 5: Verify & Add Regression Guard
- Re-run the reproduction test: verify it now passes.
- Run the full test suite and typechecks to confirm no regressions were introduced.
- Document the root cause, the mechanism of failure, and the resolution.
