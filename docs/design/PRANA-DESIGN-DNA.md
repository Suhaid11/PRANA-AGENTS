# PRANA — Brand DNA & Visual Design Philosophy

> **Design Stance:** "Clinical Spatialism / Calm Mission Control"  
> **Core Tone:** Calm like premium health tech · Precise like mission control · Human like a care product · Spatial like modern editorial interfaces.

---

## 1. The 5 Core Brand & UX Pillars

### 01 · Calm Under Pressure
In an emergency, the human mind suffers from cognitive tunnel vision. The UI must intentionally lower cortisol, not spike it. Rather than flashing alarms, chaotic red banners, and buzzing indicators, PRANA uses spacious visual rhythm, calm contrast, and clear spatial hierarchy to restore operator composure.

### 02 · Clinical Precision
High-stakes decisions require surgical clarity. Every metric, timestamp, physiological signal, and clinical recommendation must be unambiguous. We use tabular monospace numerals for all telemetry, ISO timestamps, calibrated clinical alert ranges, and explicit unit annotations.

### 03 · Continuity Across the Care Continuum
Emergency care is a relay, not an island. PRANA visually connects:
$$\text{Incident} \longrightarrow \text{Ambulance} \longrightarrow \text{AI Decision Support} \longrightarrow \text{Remote Clinician} \longrightarrow \text{Receiving Facility} \longrightarrow \text{Hospital Arrival \& Handover}$$
The active emergency case is a singular, persistent thread running through every screen.

### 04 · Action Clarity (The 4-Question Rule)
Every alert or diagnostic card in PRANA must immediately answer four questions without scrolling:
1. **What happened?** *(e.g., Blood oxygen saturation dropped below 90%)*
2. **Why does it matter?** *(e.g., Risk of hypoxia and shock deterioration in trauma)*
3. **Who needs to act?** *(e.g., Paramedic intervention + Remote Clinician review)*
4. **What can be done right now?** *(e.g., Titrate high-flow O2, prepare suction, alert receiving trauma bay)*

### 05 · Human Care Over Cold Data
Patients are not abstract database rows. The UI highlights human context: age, sex, primary complaint, consciousness state (AVPU / GCS), and family contact where available, balancing hard telemetry with clinical empathy.

---

## 2. Visual Stance & Color System

PRANA is **Light-First by default**. In bright ambulance cabins and brightly lit hospital triage bays, low-contrast dark themes wash out. PRANA uses a luminous, soft-neutral base with high-contrast text and a singular, unmistakable electric clinical blue.

### Primary Color Palette

```
Canvas / Base:        #F8FAFC (Soft cool off-white, calm and expansive)
Surface / Floating:    #FFFFFF (Pure crisp white with 1px border)
Border / Divider:     #E2E8F0 (Subtle structural definition)
Text Primary:         #0F172A (Deep Slate, optimal contrast WCAG AAA)
Text Secondary:       #475569 (Cool Charcoal, clear metadata)
Text Tertiary:        #94A3B8 (Calm Muted, units and labels)

Brand Accent:         #0E62FE (Electric Clinical Blue — vibrant, trustworthy, focused)
Brand Light Surface:  #EFF6FF (10% tinted surface for active states)
Brand Focus Ring:     #3B82F6 (Clean accessibility halo)
```

### Semantic Status Colors (Used Strictly for Meaning)

| Semantic State | Color Hex | Background Tint | Clinical Usage |
| :--- | :--- | :--- | :--- |
| **Critical / High Risk** | `#DC2626` (Crimson) | `#FEF2F2` (5% Wash) | Severe hypoxia, hypotensive shock, active deterioration, blocked airway. |
| **Warning / Attention** | `#D97706` (Warm Amber) | `#FFFBEB` (5% Wash) | Trending vitals, traffic delay detected, pending clinician acknowledgment. |
| **Ready / Confirmed** | `#059669` (Clinical Emerald) | `#ECFDF5` (5% Wash) | Hospital pre-alert acknowledged, trauma bay prepped, team on standby. |
| **Neutral / Standby** | `#64748B` (Cool Gray) | `#F1F5F9` (5% Wash) | Stable baseline, idle telemetry, routine transit. |

---

## 3. Strict Anti-Generic AI UI Bans

To maintain world-class agency-grade polish, PRANA strictly bans common AI coding clichés:

1. ❌ **NO AI Purple / Magenta Gradients**: Strictly banned. The medical world does not use synthetic cyberpunk purples.
2. ❌ **NO Neon Button Glows / Sci-Fi Bloom**: Buttons are crisp, tactile, and restrained.
3. ❌ **NO Generic 3-Column SaaS Card Layouts**: The screen is composed as an asymmetrical command surface with a focal hero.
4. ❌ **NO Emojis in Serious UI**: Emojis (🚨, 🩺, 🚑, 💉) are banned in production code. Only calibrated Lucide SVG icons with standardized stroke weights (1.75px) are permitted.
5. ❌ **NO "AI Doctor" Chatbot Gimmicks**: AI is presented as transparent, explainable decision support chips with visible clinical evidence, never as a conversational fake persona.
6. ❌ **NO Dark Crypto/Fintech Default**: Light, clinical, daylight-ready surface first.

---

## 4. The Core Visual Motif: "The Care Conduit" (Pulse × Route)

PRANA's signature visual motif is the **Care Conduit**:
A refined, continuous graphic element that merges:
- The rhythmic frequency of an **ECG physiological waveform**
- The spatial direction of an **Emergency Transit Route**
- The unbroken chain of **Collaborative Care Handover**

When the emergency is created, the Conduit activates—pulsing gently with live telemetry and connecting the field unit to the remote hospital. If traffic delays occur, the Conduit visibly flexes, illustrating that while road transit is delayed, clinical connectivity remains instantaneous and unbroken.

---

## 5. Typography Hierarchy

PRANA pairs **Plus Jakarta Sans / Geist** (for modern, approachable clinical authority) with **Geist Mono / JetBrains Mono** (for strict tabular numerical data).

- **Display Headline:** 32px / 40px · SemiBold (600) · `-0.03em` tracking · Patient Hero & Case ID
- **Section Heading:** 20px / 28px · Medium (500) · `-0.02em` tracking · Module Titles
- **Body Clinical:** 14px / 22px · Regular (400) · Normal tracking · Clinical summaries
- **Metadata & Labels:** 11px / 16px · Medium (500) · `+0.04em` uppercase tracking · Parameter chips
- **Telemetry Numerals:** 24px / 32px · Bold (700) · Tabular numbers (`font-variant-numeric: tabular-nums`)
