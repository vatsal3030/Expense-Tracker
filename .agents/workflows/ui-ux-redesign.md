# Reusable Workflow: UI/UX Redesign & Responsive Audit

**Pattern:** Visual Hierarchy & Design System Overhaul  
**Goal:** Upgrade page aesthetics, information hierarchy, empty states, and responsive compliance to premium FinTech SaaS standards.

---

## Step 1: Baseline Visual & Screenshot Audit
1. Navigate to the target route using the browser or `browser_subagent`.
2. Inspect the existing layout across three viewports:
   - Mobile: 375 x 667 px
   - Tablet: 768 x 1024 px
   - Desktop: 1440 x 900 px
3. Identify flaws against the `OWINO_PRODUCT_REDESIGN_AND_IMPLEMENTATION_PLAN.md`:
   - Visual card competition (too many identical cards).
   - Broken or unguided empty states.
   - Contrast deficiencies on dark surfaces.
   - Layout shifts during data loading.

---

## Step 2: Establish Design Hierarchy & Tokens
1. Map components to the Owino FinTech Design System (`ui-ux-design-system` skill):
   - **Primary Metric:** Prominently sized Net Balance with semantic color (`#10B981` positive, `#F43F5E` negative).
   - **Secondary Panels:** Muted neutral background (`#121620`) with 1px border (`#1A202E`).
   - **Interactive Elements:** Ensure buttons have clear hover states, active states, and keyboard focus rings (`focus-visible:ring-2`).
2. Replace all ad-hoc inline styles with standard Tailwind CSS v4 design tokens.

---

## Step 3: Implement Contextual Empty & Loading States
1. For pages with zero records (new user or empty group):
   - Replace empty chart canvases with an informative illustration or clean icon.
   - Display a direct, helpful call to action (e.g., *"Create your first expense"*).
2. For loading states:
   - Implement skeleton loaders matching the exact card dimensions to eliminate layout shifts (CLS).

---

## Step 4: Responsive & Accessibility Validation
1. **WCAG Contrast Check:**
   - Run automated Axe-core audit:
     ```bash
     cd client && npx playwright test tests/a11y.spec.ts
     ```
   - Ensure all body text meets 4.5:1 minimum contrast ratio.
2. **Keyboard Navigation:**
   - Tab through the entire page: ensure focus order is logical and modal dialogs trap focus properly.
3. **Motion Sensitivity:**
   - Verify animations respect `prefers-reduced-motion`.

---

## Step 5: Output & Verification Deliverables
- **Expected Output:**
  - Before / After visual comparison screenshots or video.
  - Zero Axe-core accessibility violations.
  - Clean, responsive layouts on 375px, 768px, and 1440px without horizontal scrollbars.
