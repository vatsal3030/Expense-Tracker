# 📐 Owino Design System (ODS) Overview

**Version:** 2.0.0  
**Stack:** Next.js 16 + React 19 + Tailwind CSS v4 + Motion + Lenis  
**Design Philosophy:** Minimalist, High-Performance, Human-Centric FinTech  

---

## 1. System Goals

The Owino Design System (ODS) is the single source of truth for all visual tokens, accessible components, and interaction patterns across the application.

Its primary objectives:
1. **Universal Legibility:** Crystal-clear contrast for both daylight mobile viewing and comfortable nighttime usage across all age demographics.
2. **Speed & Zero Jitter:** Zero heavy backdrop blurs, zero layout shifts, smooth Lenis scrolling, and lightweight Motion transitions.
3. **No AI Slop:** Direct, transparent microcopy, self-explanatory actions, and plain English descriptions.
4. **Unified Consistency:** Every button, input, card, and modal behaves identically with shared tokens and predictable states.

---

## 2. Token Architecture

Tokens are layered into three levels:
1. **Global Primitive Tokens:** Raw color palettes, typography scales, spacing units, and radius values.
2. **Semantic Tokens:** Functional roles such as `bg-canvas`, `card-surface`, `border-subtle`, `text-primary`, `financial-positive`, and `financial-negative`.
3. **Component Tokens:** Composed styles for buttons, badges, tables, and dialogs.

---

## 3. Directory & File Structure

```text
client/src/
├── theme/
│   ├── tokens.ts          # Centralized JS/TS design tokens
│   ├── LenisProvider.tsx  # Smooth scroll provider using Lenis
│   └── ThemeContext.tsx   # Light/Dark mode state management
├── components/
│   ├── ui/                # Core Primitives (Button, Card, Badge, Input, Table)
│   ├── landing/           # Landing page sections with Motion & GSAP
│   ├── dashboard/         # Dashboard financial cards & activity feeds
│   └── groups/            # Group management & Splitwise migration
└── app/                   # App Router pages
```
