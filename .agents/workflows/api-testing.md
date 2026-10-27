# Reusable Workflow: API Testing & Contract Verification

**Pattern:** Automated Endpoint & Contract Validation  
**Goal:** Verify REST endpoints, HTTP status codes, Zod validation schemas, and dual-mode routing parity.

---

## Step 1: Endpoint Inventory & Test Matrix
1. Identify target routes across the 15 router modules:
   - Auth (`/api/auth/*`), Users (`/api/users/*`), Friends (`/api/friends/*`)
   - Groups (`/api/groups/*`), Expenses (`/api/expenses/*`), Budgets (`/api/budgets/*`)
   - Settlements (`/api/settlements/*`), Dashboard (`/api/dashboard/*`), Exports (`/api/export/*`)
   - Notifications (`/api/notifications/*`), Activity (`/api/activity/*`)
2. Define the test matrix for each endpoint:
   - Happy path (valid payload -> 200/201 + valid JSON response)
   - Unauthenticated request (missing/invalid token -> 401 Unauthorized)
   - Unauthorized access (valid token, non-member -> 403 Forbidden)
   - Validation failure (invalid types, missing fields, negative amounts -> 400 Bad Request)
   - Rate limiting (exceeded requests -> 429 Too Many Requests)

---

## Step 2: Test Execution Environment
1. Start the backend server or test container:
   ```bash
   cd server && npm run dev
   ```
2. Verify gateway health:
   ```bash
   curl -s http://localhost:5000/api/health
   ```

---

## Step 3: Automated Endpoint Verification
1. Run automated test suite:
   - Validate payload schemas against Zod definitions.
   - Verify that Decimal fields return formatted numeric strings or numbers.
   - Verify that `Idempotency-Key` headers prevent duplicate transactions.
2. Verify WebSocket connection:
   - Connect client to `/socket.io/` -> verify handshake succeeds and join-group rooms emit notifications on expense creation.

---

## Step 4: Routing Parity Check
1. Test against Monolith port (`:5000/api/*`).
2. Test against NGINX Gateway port (`:80/api/*`) in Docker Compose:
   - Ensure path-based proxy passes route to the correct microservice container.

---

## Step 5: Deliverables
- **Expected Output:**
  - Automated test run report.
  - Verification that all status codes and response structures match API contracts.
