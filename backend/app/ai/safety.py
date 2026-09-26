import re
import logging
from app.ai.schemas import DecisionSupportSignal, SafetyValidationResult

logger = logging.getLogger("prana.ai.safety")

# Clinical governance non-negotiable rejection patterns
FORBIDDEN_PRESCRIPTION_PATTERNS = [
    re.compile(r"\b(administer|prescribe|give\s+(?:antidote|medication|drug|dose|bolus)|infuse\s+|inject\s+|start\s+(?:treatment|infusion|medication|antidote))\b", re.IGNORECASE),
    re.compile(r"\b(?:push|titrate)\s+(?:atropine|pralidoxime|antivenom|fentanyl|epinephrine)\b", re.IGNORECASE),
]

FORBIDDEN_DIAGNOSIS_PATTERNS = [
    re.compile(r"\bpatient\s+has\s+(?:hemorrhagic\s+shock|organophosphate\s+poisoning|viper\s+envenomation|pelvic\s+fracture)\b", re.IGNORECASE),
    re.compile(r"\b(?:diagnosed\s+with|confirmed\s+diagnosis\s+of|definitive\s+diagnosis)\b", re.IGNORECASE),
]

FORBIDDEN_VALIDATION_CLAIMS = [
    re.compile(r"\b(?:clinically\s+validated\s+decision\s+rule|fda\s+cleared|fda\s+approved|100%\s+certainty|guaranteed\s+outcome)\b", re.IGNORECASE),
]

FORBIDDEN_OVERRIDE_PATTERNS = [
    re.compile(r"\b(?:bypass\s+clinician|override\s+(?:doctor|clinician)|auto(?:nomously)?\s+(?:dispatch|divert|administer))\b", re.IGNORECASE),
]

class SafetyPolicyViolationError(Exception):
    """Raised when an AI decision support output violates clinical safety guardrails."""
    def __init__(self, violations: list[str]):
        super().__init__(f"Clinical safety guardrail violated: {'; '.join(violations)}")
        self.violations = violations


class ClinicalSafetyValidator:
    """
    Enforces strict PRANA Clinical Safety Policy.
    AI outputs must remain purely 'Simulated Decision Support / Observable Signals'
    and must never autonomously diagnose, prescribe, or bypass human review.
    """

    MANDATORY_SAFETY_LABEL = "SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS"

    @classmethod
    def validate_signal(cls, signal: DecisionSupportSignal) -> SafetyValidationResult:
        violations: list[str] = []

        # 1. Enforce mandatory safety label
        if signal.safety_label != cls.MANDATORY_SAFETY_LABEL:
            violations.append(
                f"Missing or invalid safety label. Expected '{cls.MANDATORY_SAFETY_LABEL}', got '{signal.safety_label}'"
            )

        # 2. Enforce human clinician review gate
        if not signal.requires_clinician_review:
            violations.append("Signal must mandate human clinician review (requiresClinicianReview must be True).")

        # 3. Check for unauthorized prescription / intervention verbs
        text_to_scan = f"{signal.title} {signal.observed_data} {signal.explanation}"

        for pattern in FORBIDDEN_PRESCRIPTION_PATTERNS:
            match = pattern.search(text_to_scan)
            if match:
                violations.append(
                    f"Forbidden prescription/administration directive detected: '{match.group(0)}'. AI cannot prescribe or administer."
                )

        # 4. Check for autonomous diagnosis assertions
        for pattern in FORBIDDEN_DIAGNOSIS_PATTERNS:
            match = pattern.search(text_to_scan)
            if match:
                violations.append(
                    f"Forbidden diagnostic assertion detected: '{match.group(0)}'. AI provides observable signals, not clinical diagnoses."
                )

        # 5. Check for false medical validation claims
        for pattern in FORBIDDEN_VALIDATION_CLAIMS:
            match = pattern.search(text_to_scan)
            if match:
                violations.append(
                    f"False medical validation claim detected: '{match.group(0)}'. Demo logic must not claim validated clinical certainty."
                )

        # 6. Check for operational override attempts
        for pattern in FORBIDDEN_OVERRIDE_PATTERNS:
            match = pattern.search(text_to_scan)
            if match:
                violations.append(
                    f"Forbidden operational override directive detected: '{match.group(0)}'. AI cannot override clinicians or systems."
                )

        if violations:
            logger.warning(
                "Clinical Safety Validator REJECTED signal '%s' for case '%s'. Violations: %s",
                signal.signal_id,
                signal.case_id,
                violations
            )
            return SafetyValidationResult(is_safe=False, violations=violations)

        return SafetyValidationResult(is_safe=True, violations=[], sanitized_signal=signal)
