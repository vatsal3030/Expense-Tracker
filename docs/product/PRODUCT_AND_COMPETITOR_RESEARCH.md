# 📊 Product and Competitor Research: Owino (FairShare)

**Document:** `PRODUCT_AND_COMPETITOR_RESEARCH.md`  
**Version:** 2.0 (Minimalist & High-Performance Architecture)  
**Author:** Senior Product Designer & UX Research Lead  
**Scope:** Group Expense Sharing, Bill Splitting, UPI/Peer-to-Peer Settlements, and Ledger Simplicity  

---

## 1. Product Identification & Core Mission

### What Problem Does Owino (FairShare) Solve?
When friends, roommates, travel groups, or families share expenses, calculating who owes what becomes a tangled web of bilateral debts. Most people resort to manual mental math, messy WhatsApp spreadsheets, or clunky, ad-bloated commercial apps.

### Primary Purpose:
Provide a **blazing fast, lightweight, crystal-clear, and universally accessible** expense ledger that:
1. Keeps track of group and personal expenses without friction.
2. Minimizes debt transactions through automated graph simplification.
3. Allows instant settlements with native UPI QR codes.
4. **Is immediately legible and welcoming for users of all ages**—from college students on budget trips to senior family members sharing household groceries.

---

## 2. In-Depth Competitor Analysis

We investigated 6 major competitors across the global and Indian FinTech expense-sharing landscapes:

### Competitor 1: Splitwise
- **Target Audience:** Roommates, travelers, college students globally.
- **Strengths:** Established network effects, clean expense list concept, multiple split options.
- **Weaknesses:** 
  - Heavy monetization wall (Splitwise Pro limits free users to 3 expenses/day in several regions).
  - Intrusive banner ads and 10-second paywall delays.
  - No native UPI integration (manual cash/Venmo only).
  - Outdated mobile web interface; sluggish on low-end networks.
- **UX Opportunity for Owino:** 
  - 100% free with **zero artificial daily limits**.
  - Direct 1-click Splitwise CSV migration engine.
  - Native dynamic UPI payment QR codes for instant settlement in INR.

### Competitor 2: Tricount (by bunq)
- **Target Audience:** European travel groups, weekend trips.
- **Strengths:** Can be used without an account, clean and simple balance view.
- **Weaknesses:** 
  - Limited to single events/trips; poor long-term personal finance or recurring expenses.
  - Heavy push to open a bunq European bank account.
  - No Indian payment ecosystem support.
- **UX Opportunity for Owino:** 
  - Dual support for both temporary trip groups and permanent household/couple ledgers.
  - Clean guest participant support without forcing immediate account registration.

### Competitor 3: Settle Up
- **Target Audience:** Global groups and travelers.
- **Strengths:** Multiple currencies, offline mode, basic debt simplification.
- **Weaknesses:**
  - Dense, cluttered user interface with confusing transaction logs.
  - Cluttered color schemes that fail WCAG contrast ratios.
  - Annoying interstitial video ads on the free tier.
- **UX Opportunity for Owino:**
  - Ultra-clean visual hierarchy with high-contrast text and zero ads.
  - Instant calculations with greedy DAG minimization.

### Competitor 4: Google Pay (Bill Split / Groups in India)
- **Target Audience:** Indian mobile UPI users.
- **Strengths:** Seamless bank-to-bank UPI settlement directly inside chat.
- **Weaknesses:**
  - Extremely basic splitting (equal split only; cannot do exact amounts, shares, or percentages).
  - No multi-currency support, no export features, no recurring expense tracking.
  - Only works if all participants have Google Pay with Indian bank accounts.
- **UX Opportunity for Owino:**
  - Advanced split algorithms (Equal, Exact, Shares, Percentages) paired with universal UPI QR codes that work across *any* UPI app (PhonePe, Paytm, BHIM, Cred, GPay).

### Competitor 5: Notion / Google Sheets Templates
- **Target Audience:** Tech-savvy organizers, spreadsheet power users.
- **Strengths:** Total flexibility and custom formulas.
- **Weaknesses:**
  - Nightmare on mobile screens.
  - High cognitive load for non-technical or older members.
  - Requires manual balance balancing; zero real-time notification or automated QR payment.
- **UX Opportunity for Owino:**
  - Consumer-grade simplicity on mobile first with spreadsheet-level mathematical accuracy.

### Competitor 6: Wise (Split Bills)
- **Target Audience:** International expats and multi-currency travelers.
- **Strengths:** World-class FX conversion, clean modern typography, clear fees.
- **Weaknesses:**
  - Overkill for simple group dinners or roommate utilities.
  - Requires full KYC/identity verification for banking features.
- **UX Opportunity for Owino:**
  - Instant live FX rates without requiring bank KYC or foreign accounts.

---

## 3. Key Usability Insights & Market Gaps

1. **The "Tech Jargon & AI Slop" Fatigue:**
   Users do not want "Algorithmic Quantum Ledgers" or dark cyberpunk neon themes. They want to know:
   - *"Did I pay?"*
   - *"Do I owe anything?"*
   - *"How do I send my ₹250 back to Rahul right now?"*
2. **Readability Across Age Demographics:**
   - Older parents and relatives managing household bills struggle with low-contrast dark themes, tiny 11px gray fonts, and hidden hamburger menus.
   - The UI must feature **large, legible typography (16px base)**, **high contrast (WCAG 2.2 AA compliant)**, **warm/clean neutral card surfaces**, and self-explanatory button labels ("Add Bill", "Settle Up", "Copy Link").
3. **Frontend Performance & Device Diversity:**
   - High-end modern sites with heavy WebGL, 4MB bundles, and nested backdrop-blurs stutter on budget Android devices.
   - Owino v2 must prioritize **sub-second initial load, zero scrolling lag, and lightweight micro-animations (Motion/GSAP)** over heavy aesthetic gimmicks.
