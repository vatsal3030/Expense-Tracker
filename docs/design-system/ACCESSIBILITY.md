# ♿ Accessibility & Universal Usability Standards: ODS v2

**Document:** `ACCESSIBILITY.md`  
**Conformance Level:** WCAG 2.2 Level AA  

---

## 1. Contrast Ratios & Vision Accommodations

- **4.5:1 Minimum Contrast:** All body text meets or exceeds 4.5:1. Primary headings exceed 7:1.
- **Never Rely on Color Alone:**
  - Status indicators always pair color with text and icons:
    - You Owe: Rose text + `-` sign + Down-Right arrow icon.
    - You Are Owed: Emerald text + `+` sign + Up-Left arrow icon.
    - Settled: Slate text + Checkmark icon.
- **Zoom & Text Resizing:** Layouts adapt smoothly up to 200% browser zoom without text truncation or broken flex wrappers.

---

## 2. Motor & Keyboard Navigation

- **Visible Focus Rings:** Every interactive button, link, and form input features an unmistakable `focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-hidden` outline.
- **Minimum Tap Target:** Every clickable element on mobile measures at least **44px × 44px** to support older adults and touch-screen devices.
- **Keyboard Shortcuts:**
  - `ESC`: Closes any open modal, dialog, or drawer.
  - `TAB` / `SHIFT+TAB`: Moves forward/backward through inputs in logical reading order.
  - `ENTER`: Activates buttons and submits forms.

---

## 3. Motion & Cognitive Accessibility

- **`prefers-reduced-motion` Support:**
  - When the user enables reduced motion in their OS or browser settings, all GSAP and Motion animations automatically collapse to instant state transitions.
- **Plain English Error States:**
  - Instead of "Error 400: Bad Request", errors explain clearly:
    - *"Please enter a valid bill amount greater than ₹0."*
    - *"Your friend Rahul's email address is already added to this group."*
