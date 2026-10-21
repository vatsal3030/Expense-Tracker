# FairShare (Owino) — Future Scope, Architecture Evolution & Feature Roadmap

**Target Horizon:** 2026 – 2027  
**Author:** DeepMind Antigravity Architecture Team  
**Repository:** [github.com/vatsal3030/Expense-Tracker](https://github.com/vatsal3030/Expense-Tracker)  
**System Status:** Production Ready on AWS EC2 & Docker Compose  

---

## Executive Vision

FairShare has already established core competitive advantages:
* **Zero-fee direct UPI settlements** with dynamic QR generation.
* **Greedy minimum-cash-flow graph reduction** (cutting redundant debt transfers by up to 70%).
* **Natural language & voice quick-add** with 0ms optimistic UI.
* **Real-time Socket.io state synchronization** and high-precision financial analytics.

This document outlines the strategic roadmap to transform FairShare from a group split ledger into a **comprehensive autonomous social FinTech platform**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FAIRSHARE PLATFORM EVOLUTION                         │
├────────────────────┬────────────────────┬──────────────────────────────┤
│    Phase 1 (Q1)    │    Phase 2 (Q2)    │         Phase 3 (Q3)         │
│  AI OCR & Multimodal│ Smart Automation & │ Ecosystem Expansion &        │
│  Receipt Splitting │ Recurring Ledger   │ WhatsApp/Telegram Bots       │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ • Gemini OCR Vision│ • Auto Rent & Subs │ • Headless Chat Bot          │
│ • Itemized Dishes  │ • Budget Burn Rate │ • Real-Time WebPush PWA      │
│ • Multi-Currency FX│ • WhatsApp Alerts  │ • Tally / Zoho Tax Export    │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 1. Pillar 1: AI Multimodal Receipt & Bill Itemization (Vision OCR)

### Problem Statement
In group dinners, vacations, and supermarket runs, long paper receipts with 10–30 items are tedious to enter manually. Friends often order different items (some don't drink alcohol, some order dessert).

### Architectural Solution
```
[User Camera / Photo]
         │
         ▼
[Next.js Client Image Compressor]
         │ (Base64 / Multipart)
         ▼
[Express /api/expenses/ocr]
         │
         ├──► [Gemini 1.5 Flash Vision API]
         │       • Extract: Store name, Date, Currency
         │       • Items: [{ name: "Margherita Pizza", qty: 2, price: 900 }]
         │       • Taxes & Service Charge: { gst: 90, serviceCharge: 50 }
         │
         ▼
[Interactive Visual Dish Allocator]
         • Tap friend avatars onto each dish
         • Taxes & discounts proportionally auto-allocated
```

### Key Deliverables:
1. **Interactive Bill Allocator UI**:
   * A split view with the scanned receipt on the left and member chip toggles on the right.
   * Tap a dish (e.g. "Draft Beer ₹350") -> select only Alex and Sam.
   * Auto-apply proportional GST, VAT, and restaurant tip to only those who consumed items.
2. **Offline OCR Fallback**:
   * Client-side OCR using `Tesseract.js` for basic total extraction when offline.

---

## 2. Pillar 2: Multi-Currency Support & Real-Time FX Conversion

### Problem Statement
International trips (Goa -> Thailand -> Dubai -> Europe) currently require manual currency conversion or outside apps, creating disputes over historical exchange rates.

### Technical Implementation
* **Backend FX Sync Service**:
  * Integrate `https://open.er-api.com/v6/latest/USD` or `frankfurter.app` (100% free, zero API key required).
  * Cache hourly exchange rates in Redis (`fx:rates:latest`).
* **Multi-Currency Group Engine**:
  * Groups can hold transactions in any currency (USD, EUR, GBP, AED, THB, JPY, INR).
  * The greedy debt minimizer operates by normalizing all debts to the group's chosen base currency using the exchange rate locked at the transaction timestamp.
* **Dual Currency Display**:
  * Transactions show both local spend and base equivalent: `฿450 THB (₹1,080 INR)`.

---

## 3. Pillar 3: Automated Recurring Subscriptions & Fixed Shared Bills

### Problem Statement
Recurring expenses (apartment rent, maid/cook wages, electricity, broadband, Netflix, Spotify) must be manually entered every single month.

### Technical Architecture
```
[PostgreSQL Database]
  └── Table: RecurringExpenseRule
        ├── frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY'
        ├── dayOfMonth: 1
        ├── nextRunDate: 2026-11-01
        └── autoConfirm: true

[Node.js Cron / BullMQ Background Worker]
  └── Runs daily at 00:01 UTC:
        1. Queries rules where nextRunDate <= NOW()
        2. Spawns Expense & ExpenseShare records
        3. Fires Socket.io + Push Notifications
        4. Advances nextRunDate by 1 month
```

### User Experience:
* **"Set & Forget"**: Define flat rent of ₹30,000 split among 3 flatmates on the 1st of every month.
* **Smart Reminders**: Automated notification 2 days before the due date: *"Flat rent ₹10,000 will be logged in 48 hours"*.

---

## 4. Pillar 4: Conversational Chatbot (WhatsApp & Telegram Headless Ledger)

### Problem Statement
Opening a website or app while traveling or paying a street vendor is slower than typing a quick message on WhatsApp or Telegram.

### Architecture:
```
[WhatsApp / Telegram Webhook]
             │
             ▼
[POST /api/webhooks/bot]
             │
             ├──► [Natural Language Parser & Intent Classifier]
             │      Input: "Lunch 850 with @Alex and @Sam"
             │      Action: Create Expense, Split 3 ways
             │
             ▼
[Interactive Reply with Balance Summary]
  "✅ Logged ₹850 for Lunch in 'Goa Trip'.
   Alex owes you ₹283.33
   Sam owes you ₹283.33
   Settle via UPI: [Pay ₹283 via GPay]"
```

### Advantages:
* Zero app installation needed for non-tech-savvy friends.
* Direct deep-link in WhatsApp chat to view full receipt or settle instantly.

---

## 5. Pillar 5: Offline-First PWA with Background Sync (IndexedDB)

### Problem Statement
Expense splitting frequently happens in restaurants with poor cellular reception, remote hiking trips, or flights.

### Technical Implementation:
1. **Service Worker Cache**:
   * Pre-caches application shell, icons, and theme assets via Next.js PWA plugin (`@serwist/next` or workbox).
2. **IndexedDB Local Ledger (`idb-keyval` / Dexie.js)**:
   * When offline, all Quick Logs are written immediately to `offline_expenses_queue`.
   * The UI shows an offline indicator badge: `⚡ 2 expenses pending sync`.
3. **Background Sync API**:
   * When connection is restored, the queue flushes in chronological order using the client-side idempotency keys.

---

## 6. Pillar 6: Predictive Budget Burn Rate & Overspending Guardrails

### Problem Statement
Users only realize they've overspent at the end of the month when bills arrive.

### Feature Specifications:
* **Dynamic Budget Pacing**:
  * Tracks day-by-day spend velocity against monthly target.
  * Formula: $\text{Daily Safe Spend} = \frac{\text{Remaining Budget}}{\text{Remaining Days in Month}}$.
* **Proactive Burn Rate Alerts**:
  * *"At your current rate of ₹1,800/day, your Dining budget will deplete in 6 days."*
* **Group Trip Budget Thresholds**:
  * Trip admin sets a budget cap (e.g. ₹50,000 for Goa Trip).
  * Color changes from Emerald -> Amber (80%) -> Crimson (100% exceeded).

---

## 7. Pillar 7: Export, PDF Invoices & Business Reimbursement

### Problem Statement
Users who pay for corporate team lunches or travel need formal invoices and reports for HR reimbursement.

### Deliverables:
* **1-Click PDF Expense Report Generator**:
  * Professional printable invoice with breakdown, GST numbers, attached receipt images, and member sign-off summary.
* **Spreadsheet & Tax Formats**:
  * Direct export to Excel (`.xlsx`), CSV, and QuickBooks/Zoho Expense compatible schemas.

---

## 8. Prioritized Implementation Roadmap

| Priority | Feature Milestone | Complexity | Impact | Estimated Timeline |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | **AI Camera Receipt OCR (Gemini Vision)** | Medium | Very High | 2 Weeks |
| **P0** | **Automated Monthly Recurring Expenses** | Low | High | 1 Week |
| **P1** | **Multi-Currency Real-time FX Engine** | Medium | High | 1.5 Weeks |
| **P1** | **PWA Offline-First Background Sync** | Medium | Very High | 2 Weeks |
| **P2** | **Predictive Budget Burn Rate & Alerts** | Low | Medium | 1 Week |
| **P2** | **WhatsApp / Telegram Webhook Bot** | High | Very High | 3 Weeks |
| **P3** | **PDF Corporate Reimbursement Export** | Low | Medium | 1 Week |

---

*Document generated and persisted in repository root for architectural tracking.*
