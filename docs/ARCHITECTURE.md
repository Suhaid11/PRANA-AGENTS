# PRANA — Full-Stack Technical Architecture & Engine Specification

> **Stack:** React 19 · TypeScript · Vite · Tailwind CSS · Lucide React · Local In-Memory Demo Engine + FastAPI / SQLite Option  
> **Core Architecture:** "Single Unified Emergency Engine · Decoupled Simulation · 100% Offline Resilience"

---

## 1. Unified Emergency Engine Architecture

Rather than building 3 separate codebases for Trauma, Snakebite, and Poisoning, PRANA implements a single, high-cohesion **Emergency Engine** parameterized by scenario configuration matrices:

```
                  ┌─────────────────────────────────────────┐
                  │          PRANA EMERGENCY ENGINE         │
                  │   (State Machine, Telemetry, Triage)    │
                  └────────────────────┬────────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
        ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
        │    TRAUMA     │      │   SNAKEBITE   │      │   POISONING   │
        │   SCENARIO    │      │   SCENARIO    │      │   SCENARIO    │
        │  (Hypovolemic │      │  (Coagulo-    │      │ (Cholinergic  │
        │ Deterioration)│      │  pathic Risk) │      │  Crisis Alert)│
        └───────────────┘      └───────────────┘      └───────────────┘
```

Each scenario configuration defines:
1. `patient`: Demographic, mechanism of injury, conscious state.
2. `telemetryProgression`: Time-series curve of vital signs across the 14-step journey.
3. `observableSignals`: Bulleted physiological patterns detected by the AI decision engine.
4. `protocolRecommendations`: Standardized clinical protocol options for remote physician review.
5. `requiredHospitalCapabilities`: Criteria for the "Why This Hospital?" matching algorithm.

---

## 2. The Core Data Model (`EmergencyCase`)

```typescript
export interface EmergencyCase {
  id: string; // e.g. "PR-8492"
  scenarioType: 'TRAUMA' | 'SNAKEBITE' | 'POISONING';
  status: 'REPORTED' | 'DISPATCHED' | 'ONBOARD' | 'IN_TRANSIT' | 'ARRIVED' | 'HANDED_OVER';
  
  patient: {
    id: string;
    name: string;
    age: number;
    sex: 'MALE' | 'FEMALE';
    chiefComplaint: string;
    gcs: number;
    avpu: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
  };

  ambulance: {
    callSign: string;
    crewLead: string;
    currentSpeedKmH: number;
    baseEtaMinutes: number;
    trafficDelayMinutes: number;
    isTrafficDelayed: boolean;
  };

  telemetry: {
    heartRate: number;
    spo2: number;
    systolicBp: number;
    diastolicBp: number;
    respiratoryRate: number;
    temperatureC: number;
    history: Array<{ time: string; hr: number; spo2: number; bp: string }>;
  };

  aiDecisionSupport: {
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    detectedSignals: string[]; // e.g. ["HR increasing", "SpO2 decreasing", "BP decreasing"]
    clinicalSignificance: string; // e.g. "Pattern indicates possible deterioration."
    nextStepRecommendation: string; // e.g. "Remote clinician review requested."
    isReviewed: boolean;
  };

  clinicalReview: {
    status: 'PENDING' | 'CONFIRMED' | 'DATA_REQUESTED' | 'ESCALATED';
    reviewerName: string;
    authorizedProtocol?: string;
    reviewedAt?: string;
  };

  receivingFacility: {
    recommendedHospital: string;
    matchScorePercent: number;
    etaMinutes: number;
    distanceKm: number;
    whyThisHospital: string[];
    alternativeHospitals: Array<{
      name: string;
      distanceKm: number;
      etaMinutes: number;
      rejectionReason: string;
    }>;
  };

  hospitalReadiness: {
    hospitalName: string;
    isPreAlertAcknowledged: boolean;
    acknowledgedAt?: string;
    capabilities: {
      ctAvailable: 'READY' | 'LIMITED' | 'UNAVAILABLE';
      bloodProductsAvailable: 'READY' | 'LIMITED' | 'UNAVAILABLE';
      traumaTeamAvailable: 'READY' | 'LIMITED' | 'UNAVAILABLE';
      icuAvailable: 'READY' | 'LIMITED' | 'UNAVAILABLE';
      specialistAvailable: 'READY' | 'LIMITED' | 'UNAVAILABLE';
    };
  };

  timeline: Array<{
    id: string;
    timestamp: string;
    phase: string;
    title: string;
    description: string;
    actor: 'SYSTEM' | 'MEDIC' | 'AI' | 'CLINICIAN' | 'HOSPITAL';
    severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  }>;
}
```

---

## 3. PRANA Medical Readiness Data Model

```typescript
export interface MedicalReadinessItem {
  id: string;
  category: string;
  resourceName: string;
  status: 'READY' | 'AVAILABLE' | 'LOW' | 'UNAVAILABLE';
  notes: string;
}

export const initialMedicalReadiness: MedicalReadinessItem[] = [
  { id: '1', category: 'Supplies', resourceName: 'Emergency medication supplies', status: 'READY', notes: 'Standard emergency pack sealed' },
  { id: '2', category: 'Vascular', resourceName: 'IV supplies', status: 'READY', notes: 'Infusion sets, crystalloids verified' },
  { id: '3', category: 'Respiratory', resourceName: 'Oxygen', status: 'READY', notes: 'Main cylinder 2000 PSI + portable' },
  { id: '4', category: 'Airway', resourceName: 'Airway equipment', status: 'READY', notes: 'Suction unit & bag-valve-mask checked' },
  { id: '5', category: 'Specialty', resourceName: 'Snakebite emergency resources', status: 'AVAILABLE', notes: 'Polyvalent antivenom in cold storage' },
  { id: '6', category: 'Specialty', resourceName: 'Poisoning emergency resources', status: 'LOW', notes: 'Atropine stock nominal; charcoal low' },
  { id: '7', category: 'Trauma', resourceName: 'Trauma supplies', status: 'READY', notes: 'Tourniquets, dressings, splints verified' },
];
```

---

## 4. 100% Offline Simulation Engine & State Machine

The client application includes a self-contained in-memory event orchestrator (`SimulationDirector`):
- Operates without any external cloud, internet connection, or WebSocket server.
- Supports single-step progression, auto-play cadence, and instant reset to seed state.
- Accurately triggers the **Traffic Delay ("Care Continues")** narrative twist at Step 7, dynamically inflating travel time while showing uninterrupted clinical telemetry.
