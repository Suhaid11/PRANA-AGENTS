import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "PRANA Emergency Coordination Backend"
    VERSION: str = "2.3.0-phase17"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./prana.db")
    
    # AI Decision Support & Agent Orchestrator Configuration (Phase 20 Hybrid Laya + Qwen3)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "demo") # "demo", "hybrid", "local", "laya", "qwen3", "cloud"
    
    # System 1: Laya Fast Decision Layer (Non-autoregressive, ~421M params)
    AI_LAYA_ENABLED: bool = os.getenv("AI_LAYA_ENABLED", "true").lower() in ("true", "1")
    AI_LAYA_RUNTIME: str = os.getenv("AI_LAYA_RUNTIME", "in_process") # "in_process", "http"
    AI_LAYA_MODEL: str = os.getenv("AI_LAYA_MODEL", "Infin8-AI/laya")
    AI_LAYA_BASE_URL: str = os.getenv("AI_LAYA_BASE_URL", "http://localhost:11435")
    
    # System 2: Qwen3 Bounded Agentic Generative Model (Ollama / vLLM / mock)
    AI_QWEN3_ENABLED: bool = os.getenv("AI_QWEN3_ENABLED", "true").lower() in ("true", "1")
    AI_QWEN3_RUNTIME: str = os.getenv("AI_QWEN3_RUNTIME", "ollama") # "ollama", "vllm", "mock"
    AI_QWEN3_MODEL: str = os.getenv("AI_QWEN3_MODEL", "qwen3:8b")
    AI_QWEN3_BASE_URL: str = os.getenv("AI_QWEN3_BASE_URL", "http://localhost:11434")
    
    # Legacy / alias settings for backwards compatibility
    AI_LOCAL_RUNTIME: str = os.getenv("AI_LOCAL_RUNTIME", "ollama")
    AI_LOCAL_BASE_URL: str = os.getenv("AI_LOCAL_BASE_URL", "http://localhost:11434")
    AI_LOCAL_MODEL: str = os.getenv("AI_LOCAL_MODEL", "qwen3:8b")
    AI_CLOUD_MODEL: str = os.getenv("AI_CLOUD_MODEL", "gpt-4o-mini")
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", os.getenv("AI_QWEN3_MODEL", "qwen3:8b"))
    AI_API_BASE_URL: str = os.getenv("AI_API_BASE_URL", "https://api.openai.com/v1")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_PROVIDER_VERSION: str = os.getenv("AI_PROVIDER_VERSION", "4.0.0-hybrid-laya-qwen3")
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.1"))
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "1024"))
    AI_REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "45.0"))
    AI_FAIL_OPEN: bool = os.getenv("AI_FAIL_OPEN", "true").lower() in ("true", "1")
    AI_FALLBACK_PROVIDER: str = os.getenv("AI_FALLBACK_PROVIDER", "demo")
    
    # Agent Execution Boundaries
    AI_MAX_AGENT_ITERATIONS: int = int(os.getenv("AI_MAX_AGENT_ITERATIONS", "5"))
    AI_MAX_TOOL_CALLS: int = int(os.getenv("AI_MAX_TOOL_CALLS", "6"))
    AI_AGENT_TIMEOUT_SECONDS: float = float(os.getenv("AI_AGENT_TIMEOUT_SECONDS", "45.0"))
    AI_PROMPT_VERSION: str = os.getenv("AI_PROMPT_VERSION", "PRANA_QWEN3_AGENT_V1")
    
    # JWT Authentication & Authorization
    JWT_SECRET: str = os.getenv("JWT_SECRET", "prana-dev-secret-key-phase16-unbroken-care")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

    # Phase 23.2 Real Case Intake & Structured Extraction
    PRANA_AI_BASE_URL: str = os.getenv("PRANA_AI_BASE_URL", "http://127.0.0.1:11434")
    PRANA_AI_MODEL: str = os.getenv("PRANA_AI_MODEL", "qwen3:8b")
    PRANA_AI_VERIFY_IDENTITY: bool = os.getenv("PRANA_AI_VERIFY_IDENTITY", "true").lower() in ("true", "1")
    PRANA_STT_PROVIDER: str = os.getenv("PRANA_STT_PROVIDER", "faster-whisper")
    PRANA_STT_MODEL: str = os.getenv("PRANA_STT_MODEL", "base.en")
    PRANA_MAX_AUDIO_MB: int = int(os.getenv("PRANA_MAX_AUDIO_MB", "25"))
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()

