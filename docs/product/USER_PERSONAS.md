# 👥 Evidence-Based User Personas: Owino (FairShare)

**Document:** `USER_PERSONAS.md`  
**Version:** 2.0  
**Research Focus:** Demographics, Accessibility, Mental Models, and Usability across Generations  

---

## Persona 1: Rajesh Patel (The Household & Family Organizer)
*“I just want to see clearly who paid for groceries and electricity, and send them money without getting confused.”*

### A. Profile
- **Age:** 58
- **Role:** Retired Bank Officer / Head of Extended Family Household
- **Location:** Ahmedabad, India
- **Device:** Samsung Galaxy A-series (Medium screen, standard brightness)
- **Technical Proficiency:** Basic to Moderate (Uses WhatsApp, YouTube, Google Pay, NetBanking)
- **Accessibility Needs:** 
  - Prefers clean light backgrounds with strong contrast (black/charcoal text on clean white/off-white).
  - Struggles with low-contrast dark themes, tiny gray text, and decorative neon glows.
  - Requires touch targets at least 48px wide to prevent accidental mis-taps.

### B. Primary Goals
1. Keep track of shared monthly apartment maintenance, vegetable purchases, and family utility bills.
2. See at a single glance: **Do I owe money? Or does someone owe me?**
3. Tap one simple button to generate a UPI QR code or pay directly through his existing UPI app.

### C. Major Pain Points with Traditional / Old UI
- **Visual Overload:** "Why is everything dark black with green glow? It looks like a video game or hacker screen, not an expense book."
- **Small, Low-Contrast Numbers:** Faint gray text on dark gray cards makes reading ₹150 vs ₹1500 difficult.
- **Unclear Jargon:** Confused by terms like "Greedy DAG Algorithm" or "Decentralized Settlement Matrix". He just wants "Settle Bill".

### D. User Needs & Design Principles for Rajesh
- **Clean Basic Theme:** Crisp white/neutral slate background with familiar cards.
- **Plain Language:** "You owe ₹450" (in clear red/rose), "You are owed ₹1,200" (in clear emerald green), "All settled up" (neutral checkmark).
- **One-Tap Actions:** Obvious, high-contrast action buttons: `[+ Add Bill]` and `[ Settle Balance ]`.

---

## Persona 2: Priya Sharma (The 23-Year-Old Roommate & Weekend Trip Coordinator)
*“We went to Goa with 10 friends. I need to import our 500 expenses from Splitwise, simplify the debts, and make sure everyone pays back before the month ends.”*

### A. Profile
- **Age:** 23
- **Role:** Junior Software Engineer / Active Social Group Coordinator
- **Location:** Bengaluru, India
- **Device:** iPhone 13 & MacBook Air
- **Technical Proficiency:** High (Frequent user of Notion, Cred, Spotify, Swiggy)
- **Accessibility Needs:** Fast transitions, buttery smooth 60fps scrolling, instant feedback on mobile gestures.

### B. Primary Goals
1. Bulk import historical groups and expenses from Splitwise without hitting paywalls or daily caps.
2. Add multiple shared expenses rapidly on the go (drinks, cab, hotel, dinner) with custom splits (shares, exact amounts).
3. Let debt minimization do the heavy lifting so 10 friends only need 4 transfers to settle ₹65,000.

### C. Major Pain Points with Traditional / Old UI
- **Frontend Lag & Jitter:** Heavy DOM elements and complex CSS blur effects cause frame drops and lag when scrolling through 200+ expenses.
- **Popup Clutter:** Complex multi-step modals that overflow screen edges on mobile devices.
- **Splitwise Limits:** Paying ₹300/month just to record more than 3 bills a day is unacceptable.

### D. User Needs & Design Principles for Priya
- **Blazing Fast Performance:** Sub-100ms response times, virtualized or snappy pagination for 2,000+ items.
- **Dedicated Mobile-First Split Page:** A clean, spacious, full-screen splitting view instead of a cramped dialog.
- **Smooth Entrances:** Subtle Motion entrances and smooth Lenis scrolling that feel premium without eating CPU cycles.

---

## Persona 3: Vikram Mehta (The Busy Flatmate)
*“Tell me how much I owe, show me the QR code, let me scan it, and don't make me fill out 10 form fields.”*

### A. Profile
- **Age:** 31
- **Role:** Product Marketing Manager living with 2 roommates
- **Location:** Pune, India
- **Device:** OnePlus 11
- **Technical Proficiency:** High
- **Accessibility Needs:** Immediate zero-friction workflows; minimal taps to accomplish a task.

### B. Primary Goals
1. Check monthly flatmate debt once or twice a week.
2. Scan dynamic UPI QR code to settle exact penny amounts.
3. Receive a real-time notification when his roommate confirms the payment.

### C. Major Pain Points with Traditional / Old UI
- Having to navigate 3 levels deep into group settings just to find out how to pay back his flatmate.
- Lagging animations that delay clicking the payment button.

### D. User Needs & Design Principles for Vikram
- Prominent balance overview right at the top of the screen.
- Direct "Pay Rahul ₹720" CTA that pops the UPI QR code instantly.
