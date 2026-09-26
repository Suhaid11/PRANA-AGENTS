"""
PRANA Deterministic Emergency Engine (Python Port of emergencyEngine.ts)
Preserves 100% fidelity with the clinical rules and demonstration logic.
"""
from typing import Literal

def calculate_derived_eta(base_eta: int, traffic_delay: int) -> int:
    return max(1, base_eta) + max(0, traffic_delay)

def evaluate_clinical_signal(
    domain: str,
    heart_rate: int,
    spo2: int,
    systolic_bp: int,
    diastolic_bp: int,
    respiratory_rate: int = 18
) -> dict:
    """
    Evaluates observable physiological patterns dynamically from vitals.
    Disclaimer: All clinical thresholds are demonstration logic, not validated clinical decision rules.
    """
    shock_index = round(heart_rate / max(1, systolic_bp), 2)
    pulse_pressure = systolic_bp - diastolic_bp
    signals: list[str] = []
    risk_score = 40
    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = "LOW"
    clinical_significance = "Physiological indicators within baseline transit variance."
    next_step_recommendation = "Maintain continuous telemetry streaming and serial vital monitoring."

    if domain == "TRAUMA":
        if heart_rate > 100:
            signals.append(f"Tachycardia ({heart_rate} bpm)")
        if shock_index > 0.9:
            signals.append(f"Elevated Shock Index ({shock_index})")
        if pulse_pressure < 35:
            signals.append(f"Narrowed Pulse Pressure ({pulse_pressure} mmHg)")
        if spo2 < 92:
            signals.append(f"Hypoxia ({spo2}% SpO2)")

        if shock_index > 1.2 or (heart_rate > 120 and systolic_bp < 90):
            risk_level = "CRITICAL"
            risk_score = min(98, 85 + round(shock_index * 8))
            clinical_significance = "Observed: Persistent tachycardia + low systolic pressure + narrowing pulse pressure. Why it matters: Requires clinician review."
            next_step_recommendation = "Next step: Review current prehospital assessment and receiving-facility readiness."
        elif shock_index > 0.9 or heart_rate > 105:
            risk_level = "HIGH"
            risk_score = 78
            clinical_significance = "Observed: Compensated hemodynamic drift with persistent tachycardia and narrow pulse pressure."
            next_step_recommendation = "Next step: Remote trauma specialist review requested; confirm large-bore IV access."
        else:
            risk_level = "MODERATE"
            risk_score = 55

    elif domain == "POISONING":
        if heart_rate < 55:
            signals.append(f"Severe Bradycardia ({heart_rate} bpm)")
        if spo2 < 92:
            signals.append(f"Hypoxemia ({spo2}% SpO2)")
        if respiratory_rate > 24:
            signals.append(f"Tachypnea / Bronchorrhea ({respiratory_rate}/min)")
        signals.append("SLUDGE cholinergic toxindrome presentation")

        if heart_rate < 48 or spo2 < 88:
            risk_level = "CRITICAL"
            risk_score = 96
            clinical_significance = "Severe organophosphate cholinergic crisis with profound vagal overstimulation & respiratory compromise."
            next_step_recommendation = "Urgent clinician endorsement: authorize high-dose Atropine titration and continuous airway suctioning."
        else:
            risk_level = "HIGH"
            risk_score = 82
            clinical_significance = "Observable cholinergic toxicity pattern requiring airway vigilance and toxicologist review."
            next_step_recommendation = "Remote critical care consultation for atropinization endpoints."

    elif domain == "SNAKEBITE":
        if heart_rate > 100:
            signals.append(f"Stress Tachycardia ({heart_rate} bpm)")
        signals.append("Ascending local edema margin progression > 10cm")
        signals.append("Coagulopathy risk: 20WBCT whole blood clotting failure watch")

        if heart_rate > 115 or systolic_bp < 95:
            risk_level = "CRITICAL"
            risk_score = 90
            clinical_significance = "Suspected systemic envenomation with progressive hemotoxicity and hemodynamic compromise."
            next_step_recommendation = "Immediate specialist endorsement: alert receiving facility antivenom bank for immediate reconstitution."
        else:
            risk_level = "HIGH"
            risk_score = 80
            clinical_significance = "Significant hemotoxic viperid envenomation pattern with advancing local tissue involvement."
            next_step_recommendation = "Remote toxicology review: confirm pressure immobilization and 20WBCT sampling."

    elif domain in ("RESPIRATORY_DISTRESS", "RESPIRATORY", "PULMONARY"):
        if spo2 < 90:
            signals.append(f"Severe Hypoxemia ({spo2}% SpO2)")
        if respiratory_rate > 26:
            signals.append(f"Tachypnea ({respiratory_rate}/min)")
        if heart_rate > 105:
            signals.append(f"Compensatory Tachycardia ({heart_rate} bpm)")
        signals.append("Acute bronchospasm and increased respiratory work")

        if spo2 < 88 or respiratory_rate > 30:
            risk_level = "CRITICAL"
            risk_score = 94
            clinical_significance = "Severe acute respiratory compromise with marked hypoxemia and respiratory fatigue."
            next_step_recommendation = "Urgent specialist review: authorize non-invasive ventilation preparation and pulmonary ICU bay readiness."
        else:
            risk_level = "HIGH"
            risk_score = 80
            clinical_significance = "Observable respiratory distress pattern requiring high-flow oxygen and specialist airway monitoring."
            next_step_recommendation = "Remote specialist review for bronchodilator therapy and arrival airway readiness."

    else:
        # GENERAL_EMERGENCY / CARDIAC / OTHER
        if heart_rate > 105 or heart_rate < 55:
            signals.append(f"Heart rate deviation ({heart_rate} bpm)")
        if spo2 < 92:
            signals.append(f"Desaturation ({spo2}% SpO2)")
        if spo2 < 88 or (heart_rate > 125 and systolic_bp < 90):
            risk_level = "CRITICAL"
            risk_score = 90
            clinical_significance = "Observable physiological compromise requiring urgent clinician supervision."
            next_step_recommendation = "Immediate clinician review of telemetry and receiving ED readiness."
        elif len(signals) > 0:
            risk_level = "HIGH"
            risk_score = 75
            clinical_significance = "Observable prehospital vital deviation under specialist monitoring."
            next_step_recommendation = "Maintain continuous vitals stream and tele-specialist connection."

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "detected_signals": signals,
        "clinical_significance": clinical_significance,
        "next_step_recommendation": next_step_recommendation,
        "is_reviewed": False,
    }

def calculate_facility_matching(domain: str, candidates: list[dict]) -> tuple[str, str, list[dict]]:
    """
    Transparent Multi-Factor Facility Matching Engine
    Formula: FinalScore = round(0.40 * ClinicalFit + 0.30 * Availability + 0.30 * EtaScore)
    All components normalized to 0–100.
    """
    scored = []
    for cand in candidates:
        trauma_lvl = cand.get("trauma_level", "").lower()
        spec_fit = cand.get("specialty_fit", "").lower()
        name = cand.get("name", "").lower()
        avail = cand.get("availability", "").lower()
        eta_min = cand.get("eta_minutes", 15)

        # 1. Clinical Capability Fit
        fit_score = 70
        if domain == "TRAUMA":
            if "level-1" in trauma_lvl:
                fit_score = 98
            elif "level-2" in trauma_lvl:
                fit_score = 75
            else:
                fit_score = 50
        elif domain == "SNAKEBITE":
            if "antivenom" in spec_fit or "envenomation" in trauma_lvl:
                fit_score = 98
            elif "toxicology" in spec_fit:
                fit_score = 85
            else:
                fit_score = 60
        elif domain == "POISONING":
            if "toxicology" in spec_fit or "ramaiah" in name:
                fit_score = 98
            elif "icu" in spec_fit:
                fit_score = 80
            else:
                fit_score = 55
        elif domain in ("RESPIRATORY_DISTRESS", "RESPIRATORY", "PULMONARY"):
            if "pulmonary" in spec_fit or "icu" in spec_fit:
                fit_score = 98
            else:
                fit_score = 80

        # 2. Availability Score
        avail_score = 85
        if any(w in avail for w in ["diversion", "busy", "occupied", "closed"]):
            avail_score = 20
        elif any(w in avail for w in ["sterile", "clear", "open", "isolated"]):
            avail_score = 95

        # 3. Corridor ETA Score
        eta_score = max(0, min(100, round(100 - (eta_min * 3.5))))

        # Composite score
        match_score = round(0.40 * fit_score + 0.30 * avail_score + 0.30 * eta_score)

        updated = dict(cand)
        updated["clinical_fit_score"] = fit_score
        updated["availability_score"] = avail_score
        updated["eta_score"] = eta_score
        updated["match_score"] = match_score
        scored.append(updated)

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    top_cand = scored[0]
    for idx, c in enumerate(scored):
        c["is_primary"] = (idx == 0)

    rationale = f"{top_cand['name']} ranked #1 with composite score {top_cand['match_score']}% (Clinical Fit: {top_cand['clinical_fit_score']}%, Availability: {top_cand['availability_score']}%, Transit ETA: {top_cand['eta_minutes']} min). Evaluated across {len(candidates)} regional emergency receiving facilities."
    return top_cand["id"], rationale, scored
