# 🎨 Design Tokens & Semantic Specifications: ODS v2

**Document:** `DESIGN_TOKENS.md`  

---

## 1. Color Tokens

### 1.1 Canvas & Surface
| Token | Light Theme Value | Dark Theme Value | Usage Description |
|---|---|---|---|
| `--color-canvas` | `#F8FAFC` (Slate 50) | `#0A0E17` (Deep Slate) | Full page background |
| `--color-surface` | `#FFFFFF` (White) | `#121824` (Elevated Slate) | Cards, panels, modals |
| `--color-surface-subtle` | `#F1F5F9` (Slate 100) | `#1A2234` (Surface Highlight) | Table headers, chip backgrounds |
| `--color-border` | `#E2E8F0` (Slate 200) | `#1E293B` (Slate 800) | 1px border separation lines |
| `--color-border-hover` | `#CBD5E1` (Slate 300) | `#334155` (Slate 700) | Interactive borders on focus/hover |

### 1.2 Typography & Text
| Token | Light Theme Value | Dark Theme Value | Contrast Ratio |
|---|---|---|---|
| `--color-text-primary` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | 12.5:1 (AAA) |
| `--color-text-secondary`| `#475569` (Slate 600) | `#94A3B8` (Slate 400) | 5.2:1 (AA) |
| `--color-text-muted` | `#64748B` (Slate 500) | `#64748B` (Slate 500) | 4.6:1 (AA) |

### 1.3 Financial Semantics
| Semantic Role | Light Value | Dark Value | Meaning |
|---|---|---|---|
| `--financial-positive` | `#059669` (Emerald 600) | `#10B981` (Emerald 500) | You are owed (+), Settled success |
| `--financial-negative` | `#DC2626` (Red 600) | `#F43F5E` (Rose 500) | You owe (-), Overdue |
| `--financial-neutral` | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Settled (₹0 balance), Not involved |
| `--brand-primary` | `#0D9488` (Teal 600) | `#14B8A6` (Teal 500) | Primary actions, CTA buttons |

---

## 2. Spacing & Radius Tokens

### Spacing Scale
- `2` = 8px (Tight padding)
- `3` = 12px (Form control padding)
- `4` = 16px (Card content padding)
- `6` = 24px (Card gap / grid spacing)
- `8` = 32px (Section margins)
- `12` = 48px (Hero vertical rhythm)

### Border Radius
- `sm` = 6px (Badges, tags)
- `md` = 8px (Form inputs, secondary buttons)
- `lg` = 12px (Cards, primary action buttons)
- `xl` = 16px (Modals, elevated sheets)
- `full` = 9999px (Avatars, pill badges)

---

## 3. Shadows & Elevation

Instead of heavy fuzzy blurs, ODS uses crisp, minimal elevation:
- `card`: `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)`
- `popover`: `0 4px 12px -2px rgba(0, 0, 0, 0.08)`
- `modal`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`
