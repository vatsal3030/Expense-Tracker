---
name: code-review-evidence
description: >-
  Enforces evidence-based code reviews and quality verification. Use when reviewing code,
  evaluating pull requests, or preparing release deliverables.
---

# Evidence-Based Code Review Procedure

Every code review comment, security finding, or performance critique MUST be backed by verifiable evidence. Speculation or vague feedback is prohibited.

## The 4 Evidence Pillars

1. **Exact File & Line Location:**
   - Always quote the specific file path and line numbers: `client/src/components/ExpenseModal.tsx#L42-L48`.
2. **Deterministic Reproduction or Scenario:**
   - Provide the specific payload, user action, or edge case that triggers the defect.
3. **Verified Standard / Invariant Violation:**
   - Link to the violated invariant: e.g., CWE-284 (Improper Access Control), WCAG 1.4.3 (Contrast Minimum), or zero-sum balance conservation.
4. **Tested Remediation Code Diff:**
   - Provide an exact, drop-in replacement snippet demonstrating the corrected logic.

## Review Decision Matrix
- **BLOCKING:**
  - Hardcoded secret, credential, or private key.
  - Potential balance desynchronization or arithmetic truncation.
  - IDOR / unauthorized data access across tenants or groups.
  - Unhandled promise rejection or unhandled crash vector in service process.
- **NON-BLOCKING (Advisory):**
  - Minor naming improvements.
  - Optional stylistic refactoring consistent with existing conventions.
  - Micro-optimizations with no measurable benchmark impact.

## Pre-Approval Verification
Before recommending that any code change be merged:
- Run the linter (`npm run lint`).
- Run the TypeScript compiler (`npx tsc --noEmit`).
- Verify that automated tests pass.
