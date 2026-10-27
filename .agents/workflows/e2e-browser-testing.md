# Reusable Workflow: End-to-End Browser & Responsive Testing

**Pattern:** Playwright & Antigravity Browser Subagent Automation  
**Goal:** Validate complete end-user journeys, responsive layouts, forms, and visual fidelity across multiple device viewports.

---

## Step 1: Environment Readiness
1. Start both client and server:
   ```bash
   npm run dev
   ```
2. Verify services are listening:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5000` (or `http://localhost:80` under Docker)

---

## Step 2: Automated Playwright Journey Execution
1. Execute the end-to-end test suite:
   ```bash
   cd client && npx playwright test
   ```
2. Core test journeys covered:
   - **Authentication:** User sign-up/login -> session persistence -> redirect to dashboard.
   - **Group Management:** Create group -> invite members -> verify member avatars and balances.
   - **Expense Entry & Splitting:**
     - Create equal split expense.
     - Create exact split expense.
     - Create percentage split expense.
     - Verify participant balances update dynamically.
   - **Debt Settlement:** Click "Settle Up" -> verify simplified debt calculation -> verify UPI QR code generation -> confirm settlement.

---

## Step 3: Interactive Visual & Responsive Audit
1. Using Antigravity's `browser_subagent`:
   - Inspect key pages: Dashboard, Group Detail, Expenses List, Analytics, FairScore.
   - Resize viewport:
     - Mobile (375px): verify drawer/hamburger menu, table horizontally scrolls or collapses into cards.
     - Tablet (768px): verify fluid grid columns.
     - Desktop (1440px): verify spacious, non-stretched layouts.
2. Verify visual stability:
   - Zero layout shift during data load.
   - Skeleton screens transition smoothly into populated data.

---

## Step 4: Accessibility Validation
1. Run Axe-core accessibility scan:
   ```bash
   cd client && npx playwright test tests/a11y.spec.ts
   ```
2. Ensure 0 critical or serious WCAG 2.1 AA violations.

---

## Step 5: Deliverables
- **Expected Output:**
  - Playwright HTML test report (`client/playwright-report/index.html`).
  - Recorded session video or visual artifacts demonstrating successful journey completion.
