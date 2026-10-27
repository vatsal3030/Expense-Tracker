---
name: ponytail-minimalism
description: >-
  Enforces senior developer minimalism and anti-bloat engineering. Use when an agent is about
  to implement features, refactor code, or introduce dependencies to ensure minimal diffs,
  reuse of existing utilities, and prevention of over-engineering.
---

# Ponytail Minimalism: The Art of Unwritten Code

"He says nothing. He writes one line. It works."

The best code is the code you never wrote. As an AI agent working on Owino/FairShare, your primary value is not measured by the volume of lines generated, but by the precision, correctness, and maintainability of your changes.

## Core Directives

1. **Investigate Before Creating:**
   - Before writing any utility function, check `client/src/lib/utils.ts`, `client/src/lib/api.ts`, `server/src/lib/`, and standard library primitives.
   - Before building a custom UI widget, inspect `client/src/components/` and existing Material UI / Lucide components.

2. **Reject Unnecessary Dependencies:**
   - Never add a new npm package without asking: "Can this be solved in 5-10 lines of standard TypeScript / Node.js?"
   - Do not install helper libraries for tasks that native JavaScript easily handles (e.g., date-fns when `Intl` or existing `dayjs` in `client/package.json` already exists).

3. **Minimal Surgical Diffs:**
   - Touch only the lines directly related to the task.
   - Avoid massive re-indentation, unnecessary whitespace changes, or premature abstraction.
   - Keep pull requests and changesets reviewable in under 5 minutes.

4. **Preserve Validated Architecture:**
   - Do not replace an Express router with an alternative framework.
   - Do not switch ORMs, build tools, or linters on a whim.
   - Respect established patterns in the existing codebase.

## Checklist Before Declaring Done
- [ ] Did I reuse existing functions and components wherever possible?
- [ ] Did I introduce zero unnecessary packages?
- [ ] Is my diff under 50 lines for a bug fix or under 200 lines for a feature?
- [ ] Did I avoid modifying untouched files?
- [ ] Did I test the exact lines I changed?
