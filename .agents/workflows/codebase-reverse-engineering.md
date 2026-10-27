# Reusable Workflow: Codebase Reverse Engineering & Architecture Mapping

**Pattern:** Structural Dependency Mapping & Domain Analysis  
**Goal:** Rapidly deconstruct an unfamiliar or legacy codebase into mental models, dependency graphs, and execution lifecycles.

---

## Step 1: Repository Topology & Entry Points
1. Inspect the root files:
   - `package.json` -> engines, package manager, build scripts, workspaces.
   - `docker-compose*.yml` -> service topology, ports, environment dependencies.
   - `.github/workflows/` -> CI/CD lifecycle, linters, security scanners, deployment targets.
2. Identify application runtime entry points:
   - Frontend entry point: `client/src/app/layout.tsx` and `page.tsx`.
   - Backend entry point: `server/src/index.ts` and service entry points in `server/src/services/`.

---

## Step 2: Data Model & Relationship Reconstruction
1. Inspect `server/prisma/schema.prisma`:
   - Trace all models and relations (`User` -> `GroupMember` -> `Group` -> `Expense` -> `ExpenseShare` -> `Settlement`).
   - Identify primary keys, foreign keys, cascade delete behaviors, and index coverage.
2. Map entity lifecycle transitions:
   - How is an `Expense` created, shared, and marked as settled?
   - How does a `Settlement` update user balances?

---

## Step 3: Network & Gateway Route Tracing
1. Map NGINX reverse proxy routes (`nginx/nginx.conf`) to backend service handlers:
   - Trace `/api/groups/*` -> `expense-service` -> `group.routes.ts`.
   - Trace `/api/settlements/*` -> `settlement-service` -> `settlement.routes.ts`.
2. Document middleware execution pipeline:
   - Client request -> NGINX -> Helmet -> CORS -> Rate Limiter -> Auth Middleware (L1/L2 Cache) -> Zod Validator -> Route Handler.

---

## Step 4: Algorithmic Core Isolation
1. Locate core business algorithms (e.g., debt minimization in `settlement.service.ts`):
   - Extract mathematical formulas and graph traversal rules.
   - Identify edge case handling (cycles, rounding, multi-currency).

---

## Step 5: Deliverables & Architecture Map
- **Expected Output:**
  - Mermaid architecture diagram illustrating service connections.
  - Data Flow Diagram (DFD) showing request/response lifecycle.
  - List of architectural risks, technical debt, and uncovered failure modes.
