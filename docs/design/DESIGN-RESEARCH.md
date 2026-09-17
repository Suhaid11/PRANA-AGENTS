# PRANA — Phase 0: Design Research & Comparative Analysis

> **Document Status:** Complete · Source of Truth  
> **Product Stance:** "Clinical Spatialism / Calm Mission Control"  
> **Core Value:** "PRANA makes ambulance travel time clinically useful."

---

## 1. Executive Research Summary

Emergency prehospital care is traditionally treated as a transportation and triage challenge. In developing infrastructure, heavy traffic, and fragmented clinical systems, the ambulance is often an information silo. Critical diagnostic time is lost during transport, and receiving hospitals scramble upon arrival with zero preparation.

To solve this, PRANA is designed as an **Intelligent Prehospital Emergency-Care Coordination Platform**.

Our design research explored two distinct operational design spaces and fused them with high-end spatial product design:
1. **Enterprise Healthcare & Defense Command Centers** (GE HealthCare, Oracle Health, Ensue, Aldar, HealUDoc): Systems that prioritize situational awareness, role-tailored workspaces, resource readiness, and actionable signals over passive dashboards.
2. **Field EMS & Emergency Dispatch Suites** (ImageTrend, ESO, Lifeline Dispatch): Systems that prioritize high-pressure data capture, error-prevention under stress, continuous chronology, and seamless handoff to emergency departments.
3. **Calm Spatial & Editorial Health-Tech** (Vitalsis, Apple Health, modern spatial UI): Generous whitespace, floating tactile surfaces, restrained electric blue accents, clear typography, and a powerful focal visual anchor.

---

## 2. Comparative Reference Matrix

| Reference Domain / Product | Core Strengths | Critical Design Lessons | PRANA Application | What to Avoid |
| :--- | :--- | :--- | :--- | :--- |
| **GE HealthCare Command Center** ([gehealthcare.com](https://www.gehealthcare.com/en-us/products/software/command-center)) | Real-time clinical tiles ("Wall of Analytics"), bottleneck prediction, capacity management. | Tiles must map 1:1 to an accountable human role and operational action, not general statistics. | **Role-specific surfaces**: The Paramedic, Clinician, and Hospital see only what requires their immediate decision. | Cognitive overload, wall of 60+ indistinguishable widgets, dark dense CCTV aesthetic. |
| **Oracle Health Command Center** ([oracle.com](https://www.oracle.com/health/clinical-operations/systems-operations/)) | Longitudinal patient flow, multi-facility coordination, clinical telemetry integration. | Bedside/field data must synchronize with hospital facility planning before physical arrival. | **Hospital Readiness Console**: Real-time bay, ICU, CT, and trauma team reservation based on incoming telemetry. | Cold, dated enterprise-ERP tables, legacy Java-style forms, lack of visual breathing room. |
| **Ensue / GE Command Center** ([ensue.us](https://www.ensue.us/projects/gehealthcare/)) | Human-centered data visualization, high legibility, modular spatial layouts. | Hierarchy through deliberate visual weight and typography rather than card borders. | **Floating Command Surfaces**: Soft rounded containers, restrained borders, atmospheric elevation. | Over-styling into an agency portfolio piece that loses high-stakes clinical credibility. |
| **ImageTrend & ESO EMS** ([imagetrend.com](https://www.imagetrend.com/) / [eso.com](https://www.eso.com/ems/)) | Field ePCR, rapid trauma scoring, hospital handoff continuity, offline resilience. | Field medics cannot type long essays. Big touch targets, categorical taps, automated telemetry logging. | **Field Medic Rapid Interface**: Quick physical trauma tap-selectors, streaming vitals, automated AI summarization. | Bureaucratic 40-tab forms, billing-first UX, ugly legacy Windows tablet look. |
| **Lifeline Dispatcher Console** ([blackbyrds.digital](https://www.blackbyrds.digital/case-studies/lifeline-emergency-dispatcher-console-ux)) | Extreme stress error-prevention, zero mis-clicks, spatial routing alongside patient status. | High-stakes UI requires high contrast, generous click areas, explicit confirmation for destructive acts. | **Action-Clarity Architecture**: High-impact actions (Hospital Alert, Escalate) are unmistakable and tactile. | Crowded multi-monitor clutter, micro-buttons, unreadable tiny maps. |
| **HealUDoc Command Center** ([healudoc.com](https://healudoc.com/blog/building-a-hospital-command-centre)) | Systems-engineering perspective on clinical bottlenecks and actionable intelligence. | A metric only deserves screen space if it changes a clinical decision (e.g. ETA shift alters destination hospital). | **Decision-Driven Priority**: Signals are paired with actions (e.g. "SpO2 < 90% → Escalate / Alert ICU"). | Vanity KPIs ("Total Ambulance Miles", "Historical Averages" cluttering emergency view). |
| **Vitalsis Healthcare Concept** ([behance.net](https://www.behance.net/gallery/249624229/Vitalsis-Healthcare-Dashboard-UI-UX-Design)) | Ultra-clean clinical telemetry, tabular numerals, elegant sparklines, serene composition. | High telemetry density can look calm and premium when typography and whitespace are rigorously disciplined. | **Vital Metric Cards**: Monospace tabular digits, subtle trend sparklines, restrained color thresholds. | Decorative charts with no clinical meaning; prioritizing style over emergency scanning speed. |
| **User Visual Reference Image** | Floating spatial containers, pure off-white canvas, radiant electric blue, large focal object, pill controls. | A central focal visual anchor grounds the entire experience and creates emotional clarity and calm. | **The Care Conduit**: Central interactive visual combining the ECG pulse and journey path as the emotional anchor. | Cluttered gimmicky 3D models that distract from clinical vitals or freeze low-spec hardware. |
| **Breath Mirror / REGRID (Previous Work)** | Breath Mirror: Wellness serenity, human calm. REGRID: Extreme engineering precision, spatial telemetry. | Medical technology should calm the operator's nervous system while providing surgical precision. | **Brand Synthesis**: Serene clinical precision—never chaotic, never cold. | Copying REGRID's raw dark terminal or Breath Mirror's purely consumer wellness tone. |

---

## 3. The 4 Fundamental Design Inversions

To ensure PRANA does not look like generic software or generic AI, we institute four deliberate design inversions:

1. **From "Nearest Hospital" → "Receiving Facility Matching"**
   - *Typical Flaw:* Simple distance-based map pin.
   - *PRANA Inversion:* A transparent, multi-factor clinical suitability engine factoring Trauma level, ICU beds, CT availability, on-duty specialists, and live traffic delay. Every score is explainable with explicit decision factors.

2. **From "Generic KPI Cards" → "Actionable Decision Surfaces"**
   - *Typical Flaw:* 4 cards across the top: Total Patients, Total Ambulances, Average Speed, Open Beds.
   - *PRANA Inversion:* Information is displayed only if it dictates action. If the patient is stable, vitals are steady blue; if deterioration triggers, the UI surfaces *What Happened*, *Why It Matters*, and *Recommended Action*.

3. **From "Traffic as an Obstacle" → "Traffic as a Care Continuity Crucible"**
   - *Typical Flaw:* A red warning banner: "Traffic Delay: +12 Mins".
   - *PRANA Inversion:* Traffic becomes the core narrative device. When congestion hits, PRANA visibly activates: remote clinician remains connected, receiving ED initiates early prep, and travel time becomes diagnostic time. "If the ambulance cannot beat the traffic, the treatment should not have to wait for it."

4. **From "Black-Box AI Doctor" → "Transparent Clinical Decision Support"**
   - *Typical Flaw:* "AI Diagnosis: 94% Internal Hemorrhage." (Clinically dangerous, legally unacceptable).
   - *PRANA Inversion:* "AI Decision Support: Potential Deterioration Flagged. Signals: SpO2 dropping (91%), MAP < 65 mmHg, HR 118 bpm. Action: Clinical Specialist Review Requested."
