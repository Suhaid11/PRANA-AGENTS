# PRANA — Design Tokens & CSS Variable Specification

> **Token Philosophy:** Three-Layer Architecture: Primitive → Semantic → Component

---

## 1. Color System Tokens

```css
:root {
  /* --- 1. PRIMITIVE PALETTE --- */
  --prana-slate-50:  #f8fafc;
  --prana-slate-100: #f1f5f9;
  --prana-slate-200: #e2e8f0;
  --prana-slate-300: #cbd5e1;
  --prana-slate-400: #94a3b8;
  --prana-slate-500: #64748b;
  --prana-slate-600: #475569;
  --prana-slate-700: #334155;
  --prana-slate-800: #1e293b;
  --prana-slate-900: #0f172a;
  --prana-slate-950: #020617;

  --prana-blue-50:   #eff6ff;
  --prana-blue-100:  #dbeafe;
  --prana-blue-500:  #3b82f6;
  --prana-blue-600:  #0e62fe; /* Core Electric Clinical Blue */
  --prana-blue-700:  #1d4ed8;

  --prana-red-50:    #fef2f2;
  --prana-red-500:   #ef4444;
  --prana-red-600:   #dc2626; /* Critical Deterioration */

  --prana-amber-50:  #fffbeb;
  --prana-amber-500: #f59e0b;
  --prana-amber-600: #d97706; /* Warning / Delay */

  --prana-emerald-50:  #ecfdf5;
  --prana-emerald-500: #10b981;
  --prana-emerald-600: #059669; /* Ready / Confirmed */

  /* --- 2. SEMANTIC TOKENS --- */
  --bg-canvas:             var(--prana-slate-50);
  --bg-surface:            #ffffff;
  --bg-surface-elevated:   #ffffff;
  --bg-surface-subtle:     var(--prana-slate-100);

  --border-subtle:         var(--prana-slate-200);
  --border-strong:         var(--prana-slate-300);

  --text-primary:          var(--prana-slate-900);
  --text-secondary:        var(--prana-slate-600);
  --text-muted:            var(--prana-slate-400);

  --brand-primary:         var(--prana-blue-600);
  --brand-surface:         var(--prana-blue-50);
  --brand-border:          var(--prana-blue-100);

  --status-critical-text:  var(--prana-red-600);
  --status-critical-bg:    var(--prana-red-50);
  --status-critical-border: #fecaca;

  --status-warning-text:   var(--prana-amber-600);
  --status-warning-bg:     var(--prana-amber-50);
  --status-warning-border:  #fde68a;

  --status-ready-text:     var(--prana-emerald-600);
  --status-ready-bg:       var(--prana-emerald-50);
  --status-ready-border:   #a7f3d0;
}
```

---

## 2. Typography Tokens

```css
:root {
  --font-sans: 'Plus Jakarta Sans', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', monospace;

  /* Type Scale */
  --text-xs:   0.6875rem; /* 11px */
  --text-sm:   0.8125rem; /* 13px */
  --text-base: 0.9375rem; /* 15px */
  --text-lg:   1.125rem;  /* 18px */
  --text-xl:   1.375rem;  /* 22px */
  --text-2xl:  1.75rem;   /* 28px */
  --text-3xl:  2.25rem;   /* 36px */

  /* Tabular Numerals for Telemetry */
  --font-tabular: 'Geist Mono', monospace;
  font-feature-settings: 'tnum' on, 'zero' on, 'cv01' on;
}
```

---

## 3. Spatial & Surface Tokens

```css
:root {
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 9999px;

  /* Ambient Depth & Inner Reflection */
  --shadow-surface: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03);
  --shadow-floating: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03);
  --inner-rim: inset 0 1px 0 0 rgba(255, 255, 255, 0.8);

  /* Spacing Rhythm */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
}
```

---

## 4. Motion & Animation Tokens

```css
:root {
  --ease-clinical: cubic-bezier(0.16, 1, 0.3, 1); /* Snappy deceleration */
  --duration-rapid: 150ms;
  --duration-standard: 250ms;
  --duration-ambient: 1200ms;
}

@keyframes pulse-calm {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.02); }
}
```
