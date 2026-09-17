# PRANA — Day 3 Rehearsal, Stage & Demo Recovery Checklist

> **Competition Presentation:** 15 Minutes (10 min Live Demo + 5 min Judge Q&A)  
> **Golden Rule:** *"One person owns the mouse and keyboard. No debates on stage."*

---

## 1. Before Stepping on Stage (Pre-Flight Checklist)

- [ ] **Laptop Power**: Plugged in, power adapter connected, or battery >= 80%. Battery saver mode **OFF**.
- [ ] **Local Production Server Running**:
  - Run terminal command: `npm run preview -- --port 4173`
  - Open `http://localhost:4173/` in Chrome/Edge.
- [ ] **Airplane Mode Verified**: Disconnect Wi-Fi to prove 100% offline self-containment with zero external network dependencies.
- [ ] **Browser Window State**:
  - Fullscreen mode (`F11` or maximize without bookmarks bar visible).
  - Browser zoom reset to exactly **100%** (`Ctrl + 0`).
  - Screen resolution / projector scaling tested (1920×1080 or 1440×900).
- [ ] **Demo Director Status**:
  - Press `Ctrl + Shift + D` (or click bottom-right floating pill) to verify Demo Director toggles smoothly.
  - Leave Demo Director collapsed before commencing Act 1.
- [ ] **Offline Video Backups Accessible**:
  - Confirm video recordings are stored in `docs/recordings/`:
    - `prana_trauma_demo.webp` (9.26 MB)
    - `prana_snakebite_demo.webp` (7.03 MB)
    - `prana_poisoning_demo.webp` (10.38 MB)
  - Verify you can open them in Chrome or Edge browser tabs in case of live hardware emergency.

---

## 2. The 10-Act Live Presentation Script (Timed: 9–10 Minutes)

| Act | Module | Presenter Action | Spoken Focus / Punchline |
| :--- | :--- | :--- | :--- |
| **ACT 1** (0:00) | **Mission Portal** | Display hero: *"Where the Journey Becomes Care"*. Point to 3 scenarios and offline indicator. | *"Ambulance transit has historically been dead time. PRANA converts it into active clinical stabilization."* |
| **ACT 2** (1:00) | **Ambulance Field** | Click `[Launch TRAUMA Case]`. Point to Patient Card (Rahul Verma, 34M), contained BP display, and Care Conduit. | *"Patient in transit. The Care Conduit links Paramedic, Tele-Specialist, and Receiving Hospital."* |
| **ACT 3** (2:00) | **Ambulance Field** | Click `[SEND TO CLINICAL DECISION SUPPORT]` (or Act 3 in Demo Director). | *"Data does not magically appear. The paramedic explicitly transmits the clinical snapshot: vitals, assessment, and interventions."* |
| **ACT 4** (3:00) | **Ambulance Field** | In Demo Director, click `[Act 4: Deteriorate & AI]`. Point to dynamic signals. | *"Tachycardia worsens (126 bpm), pulse pressure narrows. PRANA detects compensated hemorrhagic shock."* |
| **ACT 5** (4:00) | **Clinician Review** | Switch to Clinician console. See received snapshot. Click `[CONFIRM]`. | *"AI recommends, but a human physician decides. Dr. Sunita Rao confirms trauma resuscitation protocol."* |
| **ACT 6** (5:00) | **Hospital Command** | Show "Why This Hospital?" breakdown (40/30/30). In Demo Director, click `[Act 6: Mutate Facility]`. | *"PRANA does not simply route to the closest clinic. In this simulated profile, Manipal's Level-1 trauma surgical capability outweighs a 3-minute transit difference."* |
| **ACT 7** (6:00) | **Hospital Command** | In Demo Director, click `[Act 7: Pre-Alert ED]`. | *"Pre-alert transmitted directly to Manipal Hospital Emergency Department with instant acknowledgment."* |
| **ACT 8** (7:00) | **Ambulance Field** | In Demo Director, click `[Act 8: Traffic +8m]`. Show banner: `TRANSPORT DELAY · CARE CONTINUES`. | *"The wheels are delayed (+8m), but care does not stop. Telemetry streams, clinician stays linked, hospital arrival updates to 22m."* |
| **ACT 9** (8:00) | **Hospital Command** | In Demo Director, click `[Act 9: Confirm Bay Ready]`. Show sterile bay verified. | *"The hospital isn't waiting for the stretcher. Bay 1 is sterile and verified before arrival."* |
| **ACT 10** (9:00) | **Shell / Portal** | Click `[Act 10: Bedside Handover]` & `[Reset Case]`. | *"The ambulance didn't become faster. The care became smarter. Thank you. We welcome your questions."* |

---

## 3. Stage Roles & Team Allocation (If Presenting as a Team)

- **Navigator / Tech Pilot (1 Person)**:
  - Exclusively controls the mouse and keyboard shortcuts.
  - Follows the speaker's vocal cues to trigger acts without rushing ahead.
- **Lead Narrator (1 Person)**:
  - Delivers the core thesis, the clinical context, and closes the pitch.
- **Clinical & AI Lead (1 Person)**:
  - Takes Q&A on decision support, explainable logic vs black-box AI, and doctor-in-the-loop safety.
- **Hospital Logistics & Scalability Lead (1 Person)**:
  - Takes Q&A on hospital matching formulas, capacity mutations, and real-world deployment roadmap.

---

## 4. Emergency Recovery Protocols (What to Do If Something Goes Wrong)

| Failure Scenario | Instant Fix |
| :--- | :--- |
| **Presenter clicked wrong button / wants to restart** | Click `[Reset Case]` in Demo Director or top-left Prana logo. Re-initializes state in <100ms without page reload. |
| **Accidental browser page refresh** | Refresh is safe—Vite serves local single-page app instantly. Select the active scenario from Mission Portal and resume. |
| **Projector cuts out or screen freezes** | Keep speaking calmly. The Navigator switches to the offline video backup (`docs/recordings/prana_trauma_demo.webp`) in a Chrome/Edge tab and plays full screen. |
| **Judge interrupts early with a technical question** | Pause the demo immediately, answer concisely using `docs/JUDGE_QA_PREP.md`, then transition smoothly back to the live screen. |

---

## 5. Final Release Verification Gate (`v1.0-competition`)

| Verification Metric | Target | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **Acceptance Gate (`npm test`)** | 42/42 Assertions | **42/42 PASSED** (Trauma: 14/14, Snakebite: 14/14, Poisoning: 14/14) | **PASS** |
| **Multi-Scenario Reset** | Clean in-memory state | **Verified** (`TRAUMA → RESET → SNAKEBITE → RESET → POISONING → RESET`) | **PASS** |
| **Linter (`npm run lint`)** | 0 errors, 0 warnings | **0 errors, 0 warnings** (oxlint across 23 files, 116 rules in 29ms) | **PASS** |
| **Production Build (`npm run build`)** | Clean bundle generation | **Build Passed** (`tsc -b && vite build` generated `dist/` bundle) | **PASS** |
| **UI Presentation State** | No test controls / no slop | **Clean presentation bar**; Demo Director toggled via `Ctrl+Shift+D` | **PASS** |
| **External Dependencies** | 0 external network calls | **100% Offline Self-Contained** (zero cloud APIs, zero external CDNs) | **PASS** |

### Release Commit & Git Tag Tracking
- **Final Cleanup Commit SHA**: `6d1f27a7067911677497fd3b203932c4960b7976` (`6d1f27a`)
- **Competition Tag**: `v1.0-competition`
- **Competition Tag Object SHA**: `3ba552dac4a61db4128fe45dd03fdbb7c7e4c0d6`

### Remaining Known Prototype Limitations
1. **Simulated Telemetry Drift**: Patient vitals and telemetry streams follow deterministic demonstration drift equations designed for offline repeatability, rather than live Bluetooth monitor packets.
2. **Simulated Facility Profiles**: Hospital capacity, surgical readiness, and bay occupancies are simulated competition demonstration profiles, not connected to live hospital EHR or 108 EMS bed registries.
3. **Deterministic Decision Rules**: AI observable signals (e.g., Shock Index, hypoxia velocity, toxidrome clustering) utilize deterministic clinical demonstration thresholds, not validated clinical decision rules.
4. **Backup Media Playback**: The offline backup recordings (`docs/recordings/*.webp`) are animated Chromium captures. Presenters should drag-and-drop or open them in Chrome or Edge rather than legacy media players (e.g., Windows Media Player) to ensure full animated playback.
