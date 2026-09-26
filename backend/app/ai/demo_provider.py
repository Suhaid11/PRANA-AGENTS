import hashlib
from app.ai.base import AIProvider
from app.ai.schemas import AIContextInput, DecisionSupportSignal

class DemoDecisionSupportProvider(AIProvider):
    """
    Deterministic Clinical Decision Support Provider for PRANA Hackathon / Demo.
    Produces reproducible, stable, explainable observable signals for:
      - PR-8492 (Trauma / Rahul Verma)
      - PR-7104 (Snakebite / Sunita Gowda)
      - PR-9521 (Poisoning / Manoj Kumar)
    
    DISCLAIMER: All algorithmic thresholds and toxindrome patterns are demonstration logic,
    not validated clinical decision rules. AI provides simulated decision support only.
    """

    @property
    def provider_name(self) -> str:
        return "DemoDecisionSupportProvider"

    @property
    def provider_version(self) -> str:
        return "1.0.0"

    def health_check(self) -> bool:
        return True

    def analyze_case_context(self, context: AIContextInput) -> DecisionSupportSignal:
        vitals = context.latest_vitals or {}
        hr = vitals.get("heart_rate", 80)
        spo2 = vitals.get("spo2", 98)
        sbp = vitals.get("systolic_bp", 120)
        dbp = vitals.get("diastolic_bp", 80)
        timestamp = vitals.get("timestamp", "14:15:00")
        
        # Calculate derived demonstration metrics
        shock_index = round(hr / (sbp if sbp > 0 else 1), 2)
        pulse_pressure = sbp - dbp

        # Deterministic signal ID based on case ID and key vital parameters
        sig_hash = hashlib.sha256(
            f"{context.case_id}:{context.domain}:{hr}:{spo2}:{sbp}:{dbp}".encode()
        ).hexdigest()[:8]
        signal_id = f"sig-{context.case_id.lower()}-{sig_hash}"

        # Source event IDs from context
        relevant_events = context.recent_event_ids[-3:] if context.recent_event_ids else [f"evt-{context.case_id}-initial"]

        if context.domain == "TRAUMA":
            title = "Hemodynamic Change Signal"
            signal_type = "HEMODYNAMIC_DECOMPENSATION_RISK"
            observed_data = (
                f"Heart rate elevated at {hr} bpm; narrowing pulse pressure ({pulse_pressure} mmHg, NIBP {sbp}/{dbp}) "
                f"with Shock Index {shock_index:.2f}."
            )
            explanation = (
                "Demonstration logic — not clinically validated. Observable vital trend indicates progressive "
                "hemodynamic instability consistent with pelvic ring disruption or occult retroperitoneal hemorrhage risk. "
                "Tele-specialist protocol review and Level-1 trauma surgical staging required."
            )

        elif context.domain == "SNAKEBITE":
            title = "Ascending Edema & Coagulation Signal"
            signal_type = "SYSTEMIC_ENVENOMATION_PROGRESSION"
            observed_data = (
                f"Viperid bite on right lower limb with ascending local tissue edema (>10 cm margin), "
                f"heart rate {hr} bpm, and pending 20WBCT whole blood clotting vulnerability."
            )
            explanation = (
                "Demonstration logic — not clinically validated. Clinical signs reflect systemic venom spread. "
                "Tourniquets strictly contraindicated. Endorsement of non-tourniquet immobilization and cold-chain "
                "polyvalent antivenom readiness required."
            )

        else: # POISONING
            title = "Vagal Bradycardia & Bronchorrhea Signal"
            signal_type = "CHOLINERGIC_CRISIS_SIGNAL"
            observed_data = (
                f"Severe vagal bradycardia ({hr} bpm) and hypoxemic drift (SpO2 {spo2}%) "
                f"with copious pulmonary secretions (SLUDGE toxindrome)."
            )
            explanation = (
                "Demonstration logic — not clinically validated. Monitored vital suppression is characteristic of "
                "acute organophosphate vapor inhalation. Aggressive airway maintenance and receiving ICU atropine/ventilator "
                "staging required."
            )

        return DecisionSupportSignal(
            signal_id=signal_id,
            case_id=context.case_id,
            generated_at=timestamp,
            provider=self.provider_name,
            provider_version=self.provider_version,
            signal_type=signal_type,
            title=title,
            observed_data=observed_data,
            explanation=explanation,
            relevant_timeline_event_ids=relevant_events,
            requires_clinician_review=True,
            status="NEW",
            safety_label="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS"
        )
