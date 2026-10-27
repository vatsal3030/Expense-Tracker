---
name: ui-ux-design-system
description: >-
  Provides FinTech design system intelligence, WCAG 2.1/2.2 AA contrast standards,
  typography pairings, responsive layout rules, and empty-state patterns for Owino.
---

# Owino FinTech UI/UX Design System Guide

Derived from UI/UX Pro Max intelligence, specifically tuned for financial splitting, personal finance, and expense tracking.

## 1. Brand & Personality
- **Mood:** Calm, confident, precise, trustworthy, premium productivity.
- **Visual Stance:** Avoid "crypto neon" or chaotic gradient badges. Present numbers with high clarity and deliberate visual hierarchy.

## 2. Color Palette & Semantics
- **Backgrounds:** Deliberate neutral surfaces with subtle elevation (`#0A0D14` background, `#121620` elevated card, `#1A202E` active border).
- **Financial Status Colors:**
  - **Positive Balance (You are owed):** `#10B981` (Emerald / Slate-green)
  - **Negative Balance (You owe):** `#F43F5E` (Rose / Crimson)
  - **Neutral / Settled:** `#94A3B8` (Slate gray)
  - **Primary Action (CTA):** `#3B82F6` (Electric cobalt / Indigo) or `#10B981` (Restrained forest green)
- **Contrast Rule:** Text must achieve at least **4.5:1** contrast ratio against backgrounds (WCAG AA). Large headings (18pt+) must achieve at least **3:1**.

## 3. Typography & Spacing
- **Font Stack:** Clean modern sans-serif (`Inter`, `Plus Jakarta Sans`, or Roboto).
- **Tabular Numerals:** For all currency and table figures, enforce `font-mono` or `font-feature-settings: 'tnum'` to prevent layout jitter when numbers change.
- **Hierarchy:** Single `<h1>` per view, followed by semantic `<h2>` and `<h3>`. No skipping heading levels.

## 4. Anti-Patterns to Avoid
- ❌ **Card Overload:** Stacking 6 cards of equal visual weight. Instead, give the primary metric (Net Balance) prominence and group secondary metrics.
- ❌ **Broken Empty States:** Showing zeroed-out broken charts with no context. Instead, provide a welcoming explanation: *"No expenses in this group yet. Add your first shared expense to start tracking."* with a direct CTA button.
- ❌ **Emoji as Icons:** Never use `💰`, `👥`, `💳` as interface icons. Always use `lucide-react` SVG icons.
- ❌ **Unstyled Loading:** Never let layout shift while fetching data; use consistent skeleton loaders matching the target component dimensions.

## 5. Responsive & Accessibility Checklist
- [ ] Responsive across mobile (375px), tablet (768px), desktop (1024px), and wide (1440px).
- [ ] Keyboard accessible: All buttons, links, and inputs have visible focus indicators (`focus-visible:ring-2`).
- [ ] Interactive touch targets: Minimum 44x44px hit areas on mobile.
- [ ] Motion preference: Wrap transitions in `@media (prefers-reduced-motion: reduce)` or Tailwind `motion-reduce:transition-none`.
