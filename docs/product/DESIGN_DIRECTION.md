# 🎨 Design Direction & Visual Language: Owino (FairShare) v2

**Document:** `DESIGN_DIRECTION.md`  
**Version:** 2.0  
**Design Philosophy:** Minimalist, High-Performance, Human-Centric FinTech  

---

## 1. Core Design Principles

1. **Clarity Over Cleverness:**
   A financial ledger is not an arcade game. Numbers must be crystal clear, status must be unmistakable, and actions must require zero guesswork.
2. **Accessible to All Generations:**
   A 60-year-old managing family groceries and a 20-year-old splitting hostel rent should both feel immediately comfortable. No tiny gray fonts, no confusing techno-jargon.
3. **Speed is a Feature:**
   Eliminate heavy GPU blur filters, excessive box-shadows, and bloated bundles. Every page must feel instantaneous, with smooth Lenis scrolling and soft Motion entrances.
4. **Zero AI Slop:**
   Every word on the screen must serve a clear user purpose. No generic marketing fluff, no fake buzzwords.

---

## 2. Visual Palette & Semantic Color Strategy

```text
Light Mode (Default Primary)
├── Page Background:       #F8FAFC (Soft neutral canvas)
├── Card / Surface:        #FFFFFF (Pure crisp white)
├── Elevated Popover:      #FFFFFF with subtle 0 4px 12px rgba(0,0,0,0.05)
├── Border Lines:          #E2E8F0 (Subtle 1px clean separation)
├── Text Primary:          #0F172A (Deep charcoal for max readability)
├── Text Secondary:        #475569 (Medium slate, 5.2:1 contrast)
└── Text Muted:            #64748B (Caption text)

Dark Mode (Clean & High-Contrast)
├── Page Background:       #0A0E17 (Deep clean slate, not muddy black)
├── Card / Surface:        #121824 (Solid elevated surface)
├── Border Lines:          #1E293B (Crisp 1px border)
├── Text Primary:          #F8FAFC (Clean crisp white)
├── Text Secondary:        #94A3B8 (High-contrast slate)
└── Text Muted:            #64748B

Financial Semantic Status
├── "You are owed" (+):    #059669 (Light) / #10B981 (Dark) — Clear Emerald
├── "You owe" (-):         #DC2626 (Light) / #F43F5E (Dark) — Clear Rose
├── Settled / Balanced:    #475569 (Light) / #94A3B8 (Dark) — Neutral Slate
└── Primary Brand Accent:  #0D9488 (Teal) / #14B8A6 (Vibrant Mint)
```

---

## 3. Typography Strategy

- **Primary Font Stack:** `Inter`, `Geist`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`.
- **Numbers & Financial Figures:** Always styled with `font-feature-settings: "tnum" 1` or `font-mono` to ensure tabular alignment in tables and cards.
- **Hierarchy:**
  - Page Title: `text-2xl font-bold tracking-tight text-slate-900 dark:text-white` (24px–28px)
  - Section Header: `text-lg font-semibold text-slate-900 dark:text-white` (18px)
  - Card Title / Label: `text-sm font-medium text-slate-600 dark:text-slate-400` (14px)
  - Primary Financial Figure: `text-2xl font-extrabold font-mono` (24px)
  - Body Text: `text-base text-slate-700 dark:text-slate-300 leading-relaxed` (16px)
  - Caption / Date: `text-xs text-slate-500 dark:text-slate-400` (12px)

---

## 4. Motion & Animation Philosophy

The user requested 5 modern animation and component tools:
1. **Motion (`motion/react` / `framer-motion`):**
   - Use for smooth page entrances (`initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}`).
   - Micro-interactions on buttons: `whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}`.
2. **GSAP (`gsap`):**
   - Use for landing page timeline animations (e.g. dynamic split calculations, interactive bill demonstration).
3. **Lenis (`lenis`):**
   - Native smooth scroll container for natural momentum scrolling on landing and marketing routes.
4. **React Bits & Magic UI Patterns:**
   - Lightweight, accessible component blueprints (Bento grids, animated number counters, shiny badges) implemented with zero bloat.
5. **Accessibility Invariant:**
   - Always wrap motion components in `useReducedMotion()` to immediately disable animations if the user has requested reduced motion in their OS.
