from abc import ABC, abstractmethod
from app.ai.schemas import AIContextInput, DecisionSupportSignal

class AIProvider(ABC):
    """
    Abstract Base Class for PRANA Clinical Decision Support Providers.
    Decouples the emergency coordination platform from specific AI/LLM vendors.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Identifier of the decision support engine."""
        pass

    @property
    @abstractmethod
    def provider_version(self) -> str:
        """Version string of the engine/model."""
        pass

    @abstractmethod
    def analyze_case_context(self, context: AIContextInput) -> DecisionSupportSignal:
        """
        Analyzes authorized emergency case context and produces a structured,
        observable decision support signal.
        Must adhere strictly to PRANA's clinical safety boundaries.
        """
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """
        Returns True if the provider is healthy and available to serve requests.
        """
        pass
