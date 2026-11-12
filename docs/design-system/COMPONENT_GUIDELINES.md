# 🧩 Component Guidelines & Architecture: ODS v2

**Document:** `COMPONENT_GUIDELINES.md`  

---

## 1. Core Component Inventory & Usage Rules

### 1. Button (`Button.tsx`)
- **Variants:**
  - `primary`: Solid brand background (`bg-teal-600 hover:bg-teal-700 text-white font-semibold`). Used for primary actions (e.g., `Add Bill`, `Settle Up`).
  - `secondary`: Subtle surface background (`bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200`). Used for secondary actions (e.g., `Cancel`, `Edit`).
  - `outline`: Border-only (`border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300`).
  - `danger`: High-visibility warning (`bg-rose-600 hover:bg-rose-700 text-white`). Used for irreversible actions (e.g., `Delete Group`, `Remove Expense`).
- **Sizes:**
  - `sm`: 36px height (table actions)
  - `md`: 44px height (default thumb-friendly tap target)
  - `lg`: 52px height (hero CTAs)
- **Animation:** Uses lightweight Motion tap feedback (`whileTap={{ scale: 0.98 }}`).

### 2. Card (`Card.tsx`)
- **Structure:**
  - Outer container: `bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs`.
  - Header: Clear title + contextual badge / action.
  - Body: High-contrast financial typography.

### 3. Financial Balance Chip (`BalanceChip.tsx`)
- **Rules:**
  - If amount > 0: Emerald chip (`+ ₹X,XXX.XX` "You are owed").
  - If amount < 0: Rose chip (`- ₹X,XXX.XX` "You owe").
  - If amount === 0: Neutral slate chip (`₹0.00` "Settled").
  - Always uses `font-mono` / `tabular-nums` for rock-solid number alignment.

### 4. Modal / Dialog (`Modal.tsx`)
- Accessible backdrop with gentle fade-in.
- Focus trap and ESC key closing.
- Mobile bottom-sheet behavior for screens under 640px.

---

## 2. Component Composition Hierarchy

```text
Tokens (theme/tokens.ts)
  └── Primitives (Button, Input, Card, Badge)
        └── Composites (ExpenseRow, GroupCard, SettleUpModal)
              └── Templates (DashboardLayout, AuthLayout)
                    └── Pages (app/dashboard, app/expenses, app/groups)
```
