# PRANA — Design System Specification
## "Clinical Spatialism" — High-Density Healthcare Operating Layer

> **Document Type**: Visual Language & Design System Specification  
> **Status**: Product Redesign Standard  
> **Aesthetic Philosophy**: Serious · Clinical · Modern · High-Confidence · Technical · Human · Calm Under Pressure  
> **Last Updated**: March 2026  

---

## 1. Design Principles & Anti-Slop Creed

PRANA moves deliberately away from the "bland dashboard" aesthetic (washed-out white cards on pale gray, generic SaaS pill buttons, emoji-as-icons, and empty whitespace). Emergency coordination requires high information density, unambiguous clinical contrast, and spatial calm under extreme cognitive load.

### The Five Tenets of PRANA Visual Language:
1. **Calm Under Pressure**: The interface must inspire supreme confidence. Typography is assertive, boundaries are crisp, and visual clutter is eliminated.
2. **Color is Clinical, Never Decorative**: Every hue carries rigorous semantic meaning. Color immediately signals physiological deterioration, sterile readiness, or human action requirement. Random accent decoration is strictly prohibited.
3. **Continuous Route over Stacked Cards**: Care is not a collection of disconnected rectangular boxes. The UI emphasizes continuous spatial conduits, uninterrupted rails, and relational vectors connecting moving field units to receiving trauma suites.
4. **Tabular Precision**: Every physiological reading, countdown timer, coordinate, and score uses monospaced tabular numerals (`tabular-nums`) to prevent optical jitter during live 3.5s sensor streaming.
5. **Human and Grounded**: While highly technical, PRANA anchors every scenario in a real human patient (Rahul, Sunita, Manoj) with explicit clinical findings, conscious states, and mechanism of injury context.

---

## 2. Color System & Semantic Palette

### 2.1 The Master Semantic Spectrum
Color communicates operational and physiological state across the emergency corridor:

| Palette Role | Base Hex | Tailored Token | Clinical & Operational Meaning |
| :--- | :--- | :--- | :--- |
| **Deep Navy Structure** | `#0B132B` | `--prana-navy-950` | Primary navigation rail, command bar framing, structural anchors. |
| **Electric / Cobalt Blue** | `#0E62FE` | `--prana-blue-600` | Active PRANA workflows, authorized actions, primary CTAs, Care Line. |
| **Cyan / Teal Telemetry** | `#06B6D4` / `#0D9488` | `--prana-teal-500` | Live sensor streams, physiological waveforms, ECG tickers, real-time sync. |
| **Medical Emerald** | `#10B981` | `--prana-green-600` | Ready bays, verified capabilities, confirmed clinician endorsements. |
| **Amber Warning** | `#F59E0B` | `--prana-amber-500` | Compensated shock, corridor traffic delays, limited hospital capacity. |
| **Critical Rose / Red** | `#EF4444` | `--prana-red-600` | Acute decompensation, hypovolemia, airway obstruction (**Reserved strictly for critical clinical alerts**). |
| **Technical Slate** | `#64748B` | `--prana-slate-500` | Secondary metadata, past event timestamps, reference range units. |
| **Warm Canvas Neutral** | `#EEF1F6` / `#F4F6F9` | `--prana-canvas` | Low-glare foundational stage reducing eye fatigue in dim ambulance cabs. |
| **High-Contrast Surface**| `#FFFFFF` | `--prana-surface` | Elevated spatial consoles with crisp inner rim illumination. |

### 2.2 Functional Hierarchy Matrix
```
[NAVY]    ────────── Structural boundaries, sidebar rails, primary identity
[BLUE]    ────────── Interactive controls, active route vectors, endorsed protocols
[TEAL]    ────────── Real-time sensor pulse, waveform oscillations, sync tickers
[EMERALD] ────────── Resuscitation bay sterile clearance, 5/5 verified assets
[AMBER]   ────────── Narrowed pulse pressure, 20WBCT watch, traffic +8m delay
[ROSE]    ────────── Decompensating shock index > 1.2, SpO2 < 88%, severe bradycardia
[SLATE]   ────────── Audit ledger stamps, sensor equipment models, reference bounds
```

---

## 3. Typography Hierarchy

PRANA utilizes a two-font system calibrated for high readability and zero optical twitching:
- **Primary Interface**: `Plus Jakarta Sans` (weights: 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold)
- **Telemetry & Numbers**: `Geist Mono` with `font-variant-numeric: tabular-nums`

### Typographic Scale & Usage:
```
Scale Token      Size / Line-Height     Weight       Sample Context
--------------------------------------------------------------------------------------
text-display     48px - 56px (0.95)     800 (Ext)    Page title ("Active Emergency.", "Clinical Decision Support.")
text-metric      36px - 44px (1.00)     800 (Mono)   Primary Vitals (112 bpm, 98/64, ETA 14 MIN)
text-submetric   24px - 28px (1.10)     700 (Mono)   Secondary Vitals, Pulse Pressure, Shock Index
text-section     14px - 16px (1.20)     800 (Ext)    Console headers ("Incoming Patient Triage", "Why This Hospital?")
text-body        13px - 14px (1.40)     500 (Med)    Clinical observations, incident summaries, rationales
text-caption     11px - 12px (1.30)     600 (Semi)   Sensor badges, metadata, crew leads, vehicle speed
text-label       10px (1.00)            800 (Caps)   Micro-eyebrows ("FIELD COMMAND", "OBSERVABLE SIGNALS")
```

---

## 4. Surfaces, Radius, Elevation & Spatial Framing

### 4.1 Spatial Surface Architecture (No Generic Flat Cards)
To avoid the monotonous "card grid" trap, PRANA uses **layered spatial planes**:

1. **Foundational Canvas Stage**:
   - Background: `--prana-canvas` (`#EEF1F6` to `#F4F6F9`) with subtle vignette.
2. **Elevated Operational Surface (`.prana-float-card`)**:
   - Background: Pure White (`#FFFFFF`) with 96% opacity backdrop blur.
   - Border: `1px solid rgba(255, 255, 255, 0.95)` with dual-tone outer border `1px solid rgba(226, 232, 240, 0.8)`.
   - Inner Rim Highlight: `inset 0 1.5px 0 0 rgba(255, 255, 255, 0.95)`.
   - Shadow: `0 20px 40px -15px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(226, 232, 240, 0.6)`.
3. **Pill Docks & Status Bridges (`.prana-float-pill`)**:
   - Floating horizontal capsules connecting disparate modules (e.g., Ambulance ↔ Hospital dock).
4. **Hero Accent Planes (`.prana-active-blue-card`)**:
   - Rich cobalt blue surface (`#0E62FE`) with internal soft gradient and deep diffuse shadow (`rgba(14, 98, 254, 0.35)`).

### 4.2 Radii Standards:
- Micro Elements (Badges, Pills): `9999px` (`rounded-full`)
- Interactive Buttons & Dropdowns: `14px - 16px` (`rounded-2xl`)
- Minor Cards & Container Blocks: `20px` (`rounded-2xl` / `rounded-3xl`)
- Major Spatial Stages: `28px` (`rounded-[28px]`)

---

## 5. Care Conduit: The Continuous Care Route Specification

The **Care Conduit** is PRANA's signature visual centerpiece. It must never devolve into a generic event timeline or vertical list.

### Visual Architecture:
```
[INCIDENT] ──► [ASSESSMENT] ──► [AMBULANCE] ──► [CLINICIAN] ──► [FACILITY] ──► [HOSPITAL READY] ──► [ARRIVAL]
    │                │                │               │               │                │                 │
 Node 0           Node 1           Node 2          Node 3          Node 4           Node 5            Node 6
```

- **Continuous Route Vector**: Rendered as a continuous SVG rail with progressive gradient fill (Cyan → Cobalt Blue → Emerald Green).
- **Living Node Embellishments**: Active step features an oscillating pulse ring with real-time status annotation.
- **Waveform Nexus**: Integrated SVG ECG waveform pulses through the center of the route, reflecting real telemetry drift.
- **Traffic Delay Interruption**: When congestion occurs, the rail visualizes the traffic delta (`+8 MINS`) dynamically along the corridor segment rather than in an alert banner.

---

## 6. Telemetry & Data Visualization Standards

1. **Sparkline Histories**:
   - Prehospital vital histories (last 10 snapshots) render as clean, zero-clipping SVG paths.
   - Strict container aspect ratio: sparkline SVG viewBox set with internal padding to prevent clipping at peaks or valleys.
   - Gradient area fills below the curve indicate physiological stability (Emerald: normal, Amber: drifting, Rose: decompensation).
2. **Tabular Numerals**:
   - Blood pressure, heart rate, and SpO2 numbers must render in `font-tabular` with unambiguous units.
   - Reference ranges displayed adjacent in muted Slate (`60-100 bpm`, `95-100% SpO2`).
3. **Shock Index Indicator**:
   - Ratio $HR / SBP$ calculated continuously.
   - If $> 0.9$, instantly tags telemetry card with high-visibility Amber/Rose badge.

---

## 7. Iconography & Visual Assets

- **Icon Library**: `lucide-react` exclusively.
- **Zero Emoji Rule**: Never use emojis (🚨, 🚑, 💉, 🏥) as user-facing icons in production views.
- **Stroke Weights**: Uniform `1.75px` or `2.0px` stroke weight across all consoles.
- **Icon Sizing**:
  - Micro Status: `12px - 14px` (`w-3.5 h-3.5`)
  - Standard Button / Row: `16px - 18px` (`w-4 h-4` / `w-4.5 h-4.5`)
  - Hero Anchor: `20px - 24px` (`w-5 h-5` / `w-6 h-6`)

---

## 8. Interaction States & Motion Guidelines

### 8.1 Motion Rules
Motion in PRANA serves one purpose: **accelerating situational awareness**.
- **Allowed Motion**:
  - Live sensor heartbeat pulse (subtle 3.5s opacity rhythm on telemetry indicator).
  - Waveform scan animation (`animate-ecg-scan`) showing active streaming connection.
  - Expanding audit ledger with smooth height interpolation.
  - Soft scale transition (`scale-105`) on active navigation icon.
- **Strictly Prohibited**:
  - Distracting endless spinning animations.
  - Page-wide entrance delays or slow progressive fades.
  - Parallax scrolling on critical emergency consoles.

### 8.2 Keyboard Accessibility
- `Ctrl + Shift + D` toggle between Product Mode and Demo Mode.
- All interactive controls feature visible high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-[#0E62FE] focus-visible:ring-offset-2`).

---

## 9. Responsive Adaptation Architecture

| Screen Width | Primary Layout Strategy | Component Modifications |
| :--- | :--- | :--- |
| **Desktop (≥ 1280px)** | 3-Column Asymmetric Spatial Canvas | Left: Patient & Interventions (4 col) · Center: Care Conduit (5 col) · Right: Telemetry & Signals (3 col). Full Care Rail at bottom. |
| **Tablet (768px - 1023px)** | 2-Column Compressed Spatial Layout | Care Conduit placed above Patient and Telemetry columns. Top header adapts to mobile pills. |
| **Mobile (< 768px)** | Priority-Driven Vertical Stack | 1. Patient Identity & Critical Alert → 2. Live Vitals Stream → 3. Care Conduit Route → 4. Hospital ETA & Bay Readiness → 5. Interventions & Care Rail. |

**Zero Overflow Gate**: Horizontal scroll width must equal client width (`scrollWidth === clientWidth`) across all viewports.
