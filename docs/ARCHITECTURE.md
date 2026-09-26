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

---

## 5. Full-Stack Persistence & Append-Only Event Store (Phase 14 & 15)

PRANA pairs its responsive frontend with a high-reliability FastAPI backend and SQLite database:
- **Canonical EmergencyCase Aggregate**: Maintained in `cases` table with version tracking (`current_version`).
- **Append-Only Event Store**: Every operational and clinical milestone is stored in `timeline_events` with monotonically increasing versions.
- **Bi-directional Case-Scoped WebSockets**: Channels scoped per `case_id` (`/api/v1/ws/cases/{case_id}`) allowing real-time multi-role synchronization across Field Medic, Remote Specialist, and Hospital Command.
- **Event Versioning & Catch-Up**: Clients reconnect and retrieve missed events via `GET /cases/{case_id}/events?after_version={v}`.

---

## 6. Authentication & Cryptographic Identity Model (Phase 16)

PRANA enforces server-side identity verification:
- **Password Security**: Passwords hashed using **Argon2id** (`PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2, hash_len=32, salt_len=16)`).
- **JWT Architecture**: Cryptographically signed JSON Web Tokens using HMAC-SHA256 (`HS256`).
- **Minimal Claims Principle**: Tokens carry only identity metadata:
  ```json
  {
    "sub": "medic@demo.prana",
    "uid": "usr-medic-102",
    "name": "Paramedic Rajesh Kumar",
    "role": "FIELD_MEDIC",
    "iat": 1790343442,
    "exp": 1790350642
  }
  ```
  *Patient vitals, clinical observations, and sensitive data are strictly forbidden inside tokens.*

---

## 7. Role-Based Access Control (RBAC) & Authoritative Permission Matrix

PRANA distinguishes **Identity** (Who are you?), **Authorization** (What can you do?), and **Clinical Authority** (Which clinical actions require specialist license?).

```
PERMISSION                    MEDIC   CLINICIAN   HOSPITAL   READINESS   ADMIN
─────────────────────────────────────────────────────────────────────────────
VIEW_CASE                     ✓       ✓           ✓          ✓           ✓
RECORD_VITAL                  ✓       ✗           ✗          ✗           ✓ (sandbox)
RECORD_OBSERVATION            ✓       ✗           ✗          ✗           ✓ (sandbox)
RECORD_INTERVENTION           ✓       ✗           ✗          ✗           ✓ (sandbox)
CLINICIAN_REVIEW              ✗       ✓           ✗          ✗           ✗
REQUEST_DATA                  ✗       ✓           ✗          ✗           ✗
ESCALATE                      ✗       ✓           ✗          ✗           ✗
ACKNOWLEDGE_SIGNAL            ✗       ✓           ✗          ✗           ✗
HOSPITAL_PREALERT_ACK         ✗       ✗           ✓          ✗           ✓ (sandbox)
BAY_READY                     ✗       ✗           ✓          ✗           ✓ (sandbox)
READINESS_UPDATE              ✗       ✗           ✗          ✓           ✓ (sandbox)
DEMO_ADMIN                    ✗       ✗           ✗          ✗           ✓
```

*Note: `PORTAL_ADMIN` manages scenarios and users, but does NOT possess implicit clinical authority.*

---

## 8. Case-Level Authorization (`CaseParticipantModel`)

Case access is not open by role alone:
- **`case_participants` table**: Maps `(case_id, user_id, role, active)`.
- Users cannot guess arbitrary case IDs (`/cases/PR-7104`) without active assignment.
- Both REST and WebSocket endpoints verify case participant assignment before returning data or accepting subscriptions.

---

## 9. Authenticated WebSockets & Reconnection Lifecycle

```
CLIENT                              SERVER
  │                                   │
  ├────── WS Connect ────────────────>│
  │   (?token=<jwt> or AUTH frame)    │
  │                                   ├─ Validate JWT Signature & Expiry
  │                                   ├─ Resolve UserModel & Active Flag
  │                                   ├─ Check CaseParticipantModel (case_id, user_id)
  │                                   │   (Reject with 4401 or 4403 if invalid)
  │<───── Handshake (CONNECTED) ──────┤
  │                                   │
  │<───── Live Domain Broadcasts ─────┤
```

---

## 10. Authoritative Event Attribution

Every domain event recorded in the Append-Only Event Store derives its actor identity directly from the authenticated JWT principal:
- Paramedic input derives `actor: current_user.display_name`, `actorUserId: current_user.id`.
- Specialist endorsement stamps `clinicianName: current_user.display_name`, `clinicianId: current_user.id`.
- Client-supplied claims in the request body are ignored.

---

## 11. Security Boundaries: Prototype vs Production

### Current Prototype Security (Phase 16)
- Argon2id password hashing.
- Cryptographically signed JWT tokens with configurable expiration.
- FastAPI dependency injection enforcing RBAC on all mutation endpoints.
- Case-level authorization check on REST and WebSocket layers.
- Authenticated WebSockets rejecting unauthorized connections (4401/4403).
- Structured audit event logging in `security_events` table.
- Browser localStorage token storage for frictionless multi-role demonstration.

### Future Production Roadmap (Phase 21+)
- **HttpOnly, SameSite=Strict, Secure Cookies**: Eliminates XSS token exfiltration.
- **Enterprise SSO & Federated Identity**: OpenID Connect / SAML2 integration for hospital LDAP.
- **Multi-Factor Authentication (MFA)**: TOTP / FIDO2 WebAuthn keys for clinical authority roles.
- **WAF & Rate Limiting**: Anti-brute-force protection on `/auth/login` and WebSocket gateways.
- **Encryption at Rest & In Transit**: AES-256 field-level encryption for PHI.

---

## 12. Agentic Clinical Coordination Engine (Phase 19)

### System Pipeline
$$\text{Ambulance Telemetry Event} \longrightarrow \text{AgentOrchestrator} \longrightarrow \text{ReadOnlyToolRegistry} \longrightarrow \text{Provider Adapter} \longrightarrow \text{ClinicalSafetyValidator} \longrightarrow \text{Tele-Specialist Console}$$

### Core Invariants
- **Strictly Read-Only Tool Execution**: 11 idempotent query tools inspecting telemetry, trends, routes, and facility readiness. Zero mutation tools accessible to the agent.
- **Prompt Injection Defense**: All ambulance observations and notes are treated as untrusted evidence in dedicated isolation blocks.
- **Missing Data Detection**: Identifies critical gaps (e.g., serial NIBP, 20WBCT clotting tests, pupil reactivity) and produces 1-click clinical requests for the tele-specialist.
- **Clinician-in-the-Loop Terminal State**: Every task terminates at `REQUIRES_HUMAN_REVIEW` and requires explicit physician sign-off.
- **Deterministic Offline Fallback**: Automated fallback ensures 0% downtime and 100% offline competition resilience.


