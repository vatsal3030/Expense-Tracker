---
name: e2e-browser-testing
description: >-
  Guides automated and interactive browser verification using Playwright and Antigravity's
  browser subagent. Use when validating UI flows, responsive layouts, auth logins, and QR settlements.
---

# End-to-End Browser & Responsive Testing Skill

This skill guides agents in validating user interfaces, interactive forms, and responsive behavior in Owino/FairShare.

## 1. Automated Playwright Testing
When running test suites from the terminal:
```bash
# Run client end-to-end tests
cd client && npx playwright test

# Run tests in headed browser or debug mode
cd client && npx playwright test --headed

# Run accessibility check with axe-core
cd client && npx playwright test tests/a11y.spec.ts
```

## 2. Interactive Verification via Browser Subagent
When using Antigravity's native `browser_subagent`:
1. **Navigate to Target Route:** Launch browser to `http://localhost:3000` or the target preview URL.
2. **Interact Like a Real User:**
   - Click navigation links, buttons, and dropdowns.
   - Fill form fields with representative edge cases (long names, special characters, fractional numbers).
   - Verify modal open/close behaviors and keyboard escape keys.
3. **Capture Visual State:**
   - Inspect DOM elements for proper contrast and alignment.
   - Verify that loading states display cleanly and settle without layout shifting.
   - Verify error messages display helpful explanations when validation fails.
4. **Responsive Testing:**
   - Test at viewport 375x667 (Mobile iPhone SE) -> verify hamburger menu collapses cleanly.
   - Test at viewport 768x1024 (Tablet iPad) -> verify sidebar collapse.
   - Test at viewport 1440x900 (Desktop) -> verify high-density dashboard grid.

## 3. Financial Test Flows to Validate
1. **Login & Session Preservation:** Sign in with Supabase test user -> confirm dashboard loads balances.
2. **Group Creation & Member Invite:** Create group -> invite friend -> verify friend appears in member list.
3. **Expense Splitting Flow:**
   - Add ₹1,500 dinner expense split equally among 3 users.
   - Verify creator is owed ₹1,000, and other 2 members owe ₹500 each.
4. **Settlement Flow:** Record settlement -> verify net balance updates to ₹0 -> verify UPI QR code displays.
