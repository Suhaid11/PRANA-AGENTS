# PRANA — Design Quality Assurance & Verification Protocol

> **Quality Gate:** "No screen is complete until rendered, measured, and rigorously critiqued."

---

## 1. The Anti-Generic AI UI Audit

Before approving any UI milestone, the interface must pass this 7-point anti-slop filter:

- [ ] **1. The Logo Removal Test:** If the PRANA logo and wordmark were removed, is the interface still unmistakably distinct from a default shadcn or Tailwind dashboard?
- [ ] **2. No Purple / Neon Bloom:** Are all AI/analytics cards free of purple gradients, neon drop shadows, and fake glassmorphism?
- [ ] **3. No Banned Emojis:** Are all icons rendered as clean SVG stroke vectors (Lucide) rather than OS emojis?
- [ ] **4. Meaningful Color Distribution:** Is more than 85% of the screen composed of calm neutrals (`#F8FAFC`, `#FFFFFF`, `#0F172A`), reserving Crimson, Amber, and Emerald strictly for physiological state changes?
- [ ] **5. Focal Anchor Integrity:** Does the view feature a dominant, asymmetrical focal point (e.g. Care Conduit or Patient Hero) rather than an endless grid of identical small cards?
- [ ] **6. Tabular Numerals:** Are all physiological values, timestamps, and ETA metrics rendered in monospace tabular digits to prevent layout jitter during updates?
- [ ] **7. Explainable Decision Support:** Does every automated recommendation display its underlying inputs, formula, and clinical author?

---

## 2. Mandatory Horizontal Overflow Gate

In accordance with the AAS design rules, horizontal scrolling on mobile viewports is a critical failure.

### Automated Console Verification Script
```javascript
// Run in Chrome DevTools or Playwright test:
const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
console.assert(overflow === 0, `HORIZONTAL OVERFLOW DETECTED: ${overflow}px`);
```

### Viewport Verification Checklist
- **390px (Mobile Portrait - iPhone 14/15):** Must measure `overflow === 0`. Navigation collapses into accessible bottom action bar or drawer.
- **768px (Tablet Portrait - iPad Mini):** Must measure `overflow === 0`. Left rail and telemetry stack cleanly.
- **1024px (Tablet Landscape / Small Laptop):** Must measure `overflow === 0`. Asymmetric 3-column surface begins.
- **1440px (Standard Desktop / Presentation Monitor):** Spacious, comfortable spatial composition.

---

## 3. Accessibility & Contrast Verification (WCAG 2.1 AA)

- **Text Contrast:**
  - `#0F172A` (Primary Text) on `#F8FAFC` (Canvas): **16.8:1** (Passes AAA).
  - `#475569` (Secondary Text) on `#F8FAFC`: **7.2:1** (Passes AAA).
  - `#0E62FE` (Brand Accent) on `#FFFFFF`: **5.1:1** (Passes AA).
  - `#DC2626` (Critical Crimson) on `#FEF2F2`: **5.4:1** (Passes AA).
- **Keyboard Navigation:**
  - All interactive buttons, tabs, and drawer triggers have visible `:focus-visible` rings (`ring-2 ring-blue-500 ring-offset-2`).
- **Semantic HTML:**
  - Landmarks `<header>`, `<main>`, `<section>`, `<nav>`, `<aside>` used appropriately.
  - ARIA live regions (`aria-live="polite"`) on incoming vitals and critical alert banners.
