# Quality Gates & Ponytail Minimalism

These rules enforce senior engineering discipline to keep the codebase clean, lean, fast, and thoroughly tested.

## 1. The Ponytail Rule (The Best Code is Unwritten)
- **Do not write what you can reuse.** Inspect existing components, utilities, and API endpoints before drafting new ones.
- **Do not add new dependencies without explicit architectural justification.** If native Node.js APIs or standard libraries can achieve the goal, do not install a new npm package.
- **Keep changes minimal and focused.** A 10-line targeted edit is always preferred over rewriting a 300-line module.
- Never "clean up" or reformat untouched files during a feature task unless specifically instructed. Preserve git blame and historical context.

## 2. Test-Driven Development (TDD) for Risky Logic
- **Financial Calculations Require Tests:** Any change touching split calculations, currency conversion, recurring schedules, or debt minimization MUST include automated test cases covering:
  - Exact split distributions
  - Odd cent/paise rounding (e.g., $100 split 3 ways)
  - Edge cases (zero amounts, negative balances, self-splits)
  - Cycle detection in settlement graphs
- **Never claim a test passed without executing it.** Always run the test command and verify output before concluding the task.

## 3. Evidence-Based Code Reviews
- When reviewing or reporting bugs, provide concrete proof:
  - The exact line number and file path.
  - The reproduction steps or payload.
  - The observed vs. expected behavior.
  - Concrete remediation code diff.
- Do not make generic claims like "this might cause a race condition" without identifying the concurrent state mechanism and providing a fix.
