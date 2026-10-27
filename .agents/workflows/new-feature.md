# Reusable Workflow: New Feature Development

**Pattern:** GSD Core 5-Phase Loop (Discuss -> Plan -> Execute -> Verify -> Ship)  
**Goal:** Deliver complete, well-architected features without context rot or regressions.

---

## Phase 1: Discuss (Requirements & Boundaries)
- **Objective:** Elicit all functional requirements, business invariants, and edge cases before drafting code.
- **Actions:**
  1. Clarify the user persona, trigger action, and expected output.
  2. Map affected domain entities in `server/prisma/schema.prisma`.
  3. Determine if backend changes impact both development monolith (`server/src/index.ts`) and microservices (`server/src/services/*`).
- **Expected Output:** Concise feature specification with user stories and edge case matrix.
- **Validation:** User signs off on requirements.

---

## Phase 2: Plan (Decomposition & TDD Design)
- **Objective:** Break down the feature into small, atomic tasks that fit within a single context window.
- **Actions:**
  1. Identify existing utilities and components to reuse (`ponytail-minimalism`).
  2. Define API contracts (Zod schemas, HTTP status codes, error payloads).
  3. Outline unit test cases and Playwright E2E scenarios.
  4. Sequence tasks: Database migrations -> Backend Services -> API Routes -> Frontend UI -> E2E Tests.
- **Expected Output:** Implementation checklist with explicit file paths and validation criteria per task.
- **Validation:** Verify zero architectural anti-patterns or redundant packages.

---

## Phase 3: Execute (Surgical Implementation)
- **Objective:** Implement tasks step-by-step using strict Red/Green TDD for core logic.
- **Actions:**
  1. For financial calculations: write the failing test first (`test-driven-development`).
  2. Implement backend service and controller methods with Zod validation.
  3. Implement frontend UI using the Owino FinTech design system tokens.
  4. Ensure all database writes are protected by transactions (`prisma.$transaction`) where multi-table consistency is required.
- **Expected Output:** Clean, minimal git commits matching the implementation plan.
- **Validation:** Code builds with zero TypeScript errors (`npx tsc --noEmit`).

---

## Phase 4: Verify (End-to-End Testing & Audits)
- **Objective:** Prove the feature works end-to-end under realistic conditions.
- **Actions:**
  1. Run the test suite: unit tests, integration tests, and Playwright E2E tests.
  2. Conduct a responsive audit across mobile (375px), tablet (768px), and desktop (1024px+).
  3. Run an accessibility audit (`@axe-core/playwright`).
  4. Check server logs for unhandled errors, warnings, or slow queries.
- **Expected Output:** Test execution logs and verification evidence demonstrating zero failures.
- **Validation:** 100% of new feature test assertions pass.

---

## Phase 5: Ship (Review & Pull Request)
- **Objective:** Prepare clean, documented release assets.
- **Actions:**
  1. Execute the `code-review-evidence` procedure on the final diff.
  2. Confirm no temporary files, secrets, or console debug statements remain.
  3. Update relevant documentation and API guides.
  4. Generate a structured PR summary with:
     - Changes implemented.
     - Evidence of passing tests and screenshots/recordings.
     - Rollback procedure.
- **Expected Output:** Ready-to-merge Pull Request.
- **Validation:** Passes CI pipeline (`lint`, `security`, `build`).
