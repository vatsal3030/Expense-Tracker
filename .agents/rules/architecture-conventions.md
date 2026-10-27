# Architecture & Coding Conventions

These rules govern all architectural, design, and coding patterns across the Owino/FairShare repository.

## 1. Dual-Mode Architecture Parity
Owino operates in two runtime paradigms. Any backend change MUST be compatible with both:
1. **Development Monolith (`server/src/index.ts` :5000):**
   - Single Express server mounting all 15 routers under `/api/*`.
   - Single Socket.io server instance attached to HTTP listener.
2. **Production Decoupled Microservices (`docker-compose.prod.yml` & `nginx/nginx.conf`):**
   - **Identity & Social Service (`server/src/services/identity.service.ts` :5001):** Routes: `/api/auth`, `/api/users`, `/api/friends`.
   - **Expense & Core Domain Service (`server/src/services/expense.service.ts` :5002):** Routes: `/api/groups`, `/api/expenses`, `/api/budgets`.
   - **Settlement & Optimization Graph Engine (`server/src/services/settlement.service.ts` :5003):** Routes: `/api/settlements`, `/api/dashboard`, `/api/export`.
   - **Real-Time Notification Service (`server/src/services/notification.service.ts` :5004):** Routes: `/api/notifications`, `/api/activities`, and `/socket.io/*`.
   - **Rule:** Never import stateful singletons directly between service boundaries without utilizing Redis or the database.

## 2. Frontend Conventions (Next.js 16 + React 19)
- **App Router:** All page components live under `client/src/app/`. Use Server Components by default; add `'use client'` only when utilizing browser APIs, state hooks, or event listeners.
- **Styling:** Use Tailwind CSS v4 utility classes and semantic CSS variables defined in `client/src/app/globals.css`. Ensure compatibility with Material UI v9 components.
- **Icons:** Use `lucide-react` for all UI icons. Never use emojis as icon substitutes in production UI.
- **Financial Numbers:** Always format financial figures using standard currency formatting functions (`Intl.NumberFormat`). Never perform raw floating-point arithmetic on the client.
- **API Requests:** Always use the centralized Axios client in `client/src/lib/api.ts` which handles auth tokens, error interceptors, and idempotency headers.

## 3. Backend Conventions (Express + Prisma)
- **Type Safety:** All request bodies and query parameters MUST be validated using **Zod schemas** before reaching controller logic (utilize `validate` middleware).
- **Database Access:** Always use the shared Prisma client in `server/src/lib/prisma.ts`. Never instantiate a new `PrismaClient()`.
- **Decimal Fields:** Amounts in the database are Prisma `Decimal` types (`@db.Decimal(12, 2)`). Convert explicitly to number/string at the serialization boundary.
- **Idempotency:** Payment, settlement, and expense creation endpoints MUST respect the `Idempotency-Key` header to prevent duplicate charge transactions.
- **Caching Discipline:**
  - L1 Token Cache (`server/src/lib/cache.ts` / `auth.ts`) prevents repeated remote auth verification.
  - Invalidate Redis cache keys immediately whenever expenses, groups, or settlements are mutated.

## 4. Reusability Over Reinvention
- **Rule of Ponytail:** Always inspect `client/src/lib/`, `client/src/components/`, `server/src/lib/`, and `server/src/middleware/` before writing new utilities.
- If a helper function exists (e.g., date formatting, currency display, JWT decoding, cache get/set), reuse it.
