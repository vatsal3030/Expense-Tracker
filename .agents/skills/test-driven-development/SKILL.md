---
name: test-driven-development
description: >-
  Enforces a strict Red-Green-Refactor test-driven development workflow for new features,
  split calculations, and financial algorithms in Owino/FairShare.
---

# Test-Driven Development (TDD) Workflow

In financial platforms, untested calculations cause direct balance discrepancies. Follow this strict Red-Green-Refactor sequence.

## 1. Red Phase: Write the Failing Test First
1. Identify the input conditions, boundary limits, and expected outputs.
2. Write a minimal test case in the test suite that asserts the desired behavior.
3. Run the test:
   - **Requirement:** The test MUST fail for the expected reason (e.g., function not found, assertion mismatch).
   - If the test passes before implementation, your test is invalid or the functionality already exists.

## 2. Green Phase: Make It Pass Minimally
1. Write the simplest possible implementation that satisfies the test.
2. Do not prematurely optimize or generalize beyond the test assertions.
3. Run the test command:
   - Verify that the test now passes cleanly.

## 3. Refactor Phase: Clean & Harden
1. Review the code against `ponytail-minimalism`:
   - Eliminate duplicated logic.
   - Improve naming and clarity.
   - Ensure proper error handling and types.
2. Re-run tests to confirm that refactoring did not break any behavior.

## Core Rules for Financial Tests in Owino
- Test rounding on odd splits (e.g., $100 split equally among 3 users: 33.34, 33.33, 33.33 -> sum must equal 100.00).
- Test currency conversion with known exchange rates.
- Test settlement graph cycle elimination (A owes B, B owes C, C owes A).
- Test unauthorized access rejection (HTTP 401/403).
