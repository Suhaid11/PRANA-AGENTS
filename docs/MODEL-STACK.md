# PRANA Model Stack Specification

> **Phase 21 Architectural Standard**: Hybrid Open AI Engine (System 1 + System 2 + Human Authority)  
> **Last Verified**: September 2026 (Phase 21 — 30-Case Benchmark, Execution Mode Truthfulness, Role-Projected Views)

---

## 1. Executive Summary

PRANA adopts a **Hybrid Open/Local AI Architecture** designed specifically for the **Agentic AI for Billions** competition track. Rather than deploying a single large, computationally prohibitive model for every ambient event, PRANA decomposes clinical coordination into three distinct, non-overlapping operational layers:

```
Ambulance / Sensor Event
           │
           ▼
┌────────────────────────────────────────┐
│  SYSTEM 1: LAYA FAST DECISION GATE     │  (Lightweight ~421M non-autoregressive,
│  - Event Relevance Classification      │   single forward-pass, typed decisions)
│  - Tool Bundle Routing Recommendation  │
│  - Review Priority Grading (P0–P3)     │
│  - Clinical Data Sufficiency Check     │
└──────────────────┬─────────────────────┘
                   │
         [Deep Analysis Warranted?]
         ├── NO  ──► FAST-PATH EXIT (Zero generative compute wasted on routine events)
         │
         └── YES
           │
           ▼
┌────────────────────────────────────────┐
│  SYSTEM 2: QWEN3 BOUNDED AGENT         │  (Local open-weight reasoning model,
│  - Multi-Turn Read-Only Tool Loop      │   Apache 2.0, Ollama/vLLM/llama.cpp/embedded)
│  - ReadOnlyToolRegistry Invocation     │
│  - Prompt-Injection Defense Isolation  │
│  - Detected Data Gaps Identification   │
│  - Structured Observable Signal Synth  │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│  CLINICAL SAFETY VALIDATOR             │  (Deterministic policy gate: zero autonomous
│  - Banned Action Check (No Rx/Admin)   │   prescriptions, certainty suppression,
│  - Observable Phrasing Enforcement     │   provenance verification)
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│  HUMAN CLINICIAN (Tele-Specialist)     │  (MANDATORY terminal state:
│  - Confirm / Request Data / Escalate   │   REQUIRES_HUMAN_REVIEW)
└────────────────────────────────────────┘
```

---

## 2. Model 1: LAYA (System 1 Fast Decision Layer)

### 2.1 Upstream Provenance & Metadata
- **Canonical Upstream Repository**: `https://github.com/NandhaKishorM/laya`
- **Hugging Face Model Card**: `https://huggingface.co/Infin8-AI/laya`
- **Model Version**: Laya v1.0
- **License**: Apache 2.0
- **Parameter Count**: ~421M parameters
- **Architecture**: Non-autoregressive Transformer with typed classification and decision heads. Single forward-pass evaluation.
- **Local Runtime**: Python in-process runtime (`transformers` / `onnxruntime` / PyTorch fallback).

### 2.2 Purpose in PRANA
Laya is **NOT** a medical diagnosis model and does **NOT** generate natural-language clinical text. Its role is strictly computational orchestration:
1. **Event Relevance**: Classifies events into `no_analysis`, `routine_analysis`, or `deep_analysis`. Enables immediate **Fast-Path exits** for non-clinical events (e.g. `ROUTE_UPDATED`), saving expensive GPU/CPU cycles.
2. **Tool Bundle Routing**: Recommends the primary evidence category to inspect first (`vitals`, `trends`, `observations`, `interventions`, `transport`, `readiness`, `handover`), guiding System 2 to gather high-yield data first.
3. **Review Priority**: Assigns routing priority (`P0` Immediate, `P1` High, `P2` Moderate, `P3` Routine).
4. **Data Sufficiency**: Checks if recorded telemetry contains sufficient parameters to attempt grounded reasoning.

### 2.3 Hardware & Footprint
- **RAM / VRAM**: ~1.2 GB RAM (CPU) or ~850 MB VRAM (GPU).
- **Latency**: ~12–25 ms per inference pass.

---

## 3. Model 2: QWEN3 (System 2 Bounded Generative Agent)

### 3.1 Upstream Provenance & Metadata
- **Canonical Upstream Repository**: `https://github.com/QwenLM/Qwen3`
- **Function Calling Documentation**: `https://github.com/QwenLM/Qwen3/blob/main/docs/source/framework/function_call.md`
- **Qwen-Agent Framework**: `https://github.com/QwenLM/Qwen-Agent`
- **Hugging Face Hub**: `https://huggingface.co/Qwen`
- **Recommended Default Checkpoint**: Qwen3 8B Instruct / GGUF Q4_K_M (~5.03 GB)
  - Reference: `https://huggingface.co/unsloth/Qwen3-8B-GGUF`
- **Small Profile Alternative**: Qwen3 4B / Qwen2.5 3B Instruct (~2.1 GB)
- **License**: Apache 2.0
- **Supported Local Runtimes**: Ollama (`ollama run qwen3:8b`), vLLM (OpenAI-compatible server), llama.cpp, or embedded local provider.

### 3.2 Purpose in PRANA
Qwen3 is **NOT** a medical diagnostician. It operates as a **bounded coordinator** with zero state-mutation authority:
1. **Dynamic Tool Calling**: Evaluates case state by invoking strictly read-only tools from `ReadOnlyToolRegistry` (`get_latest_vitals`, `get_vital_trend`, `get_recent_observations`, `get_destination_readiness`).
2. **Untrusted Evidence Isolation**: Treats paramedic narrative notes and user input as untrusted data rather than prompt instructions, preventing prompt injection attacks.
3. **Explicit Missing Data Detection**: Identifies omitted critical parameters (e.g., missing 20WBCT clotting times in snakebite, pupil dilation in poisoning) rather than hallucinating plausible values.
4. **Structured Output Synthesis**: Generates Pydantic-validated `AgentTaskSchema` objects with observable clinical signals, evidence provenance, and uncertainty boundaries.
5. **Doctor-in-the-Loop Enforcement**: Invariably terminates at `REQUIRES_HUMAN_REVIEW`.

### 3.3 Hardware Profiles
- **Target Hardware (Tested Machine)**:
  - CPU: 13th Gen Intel Core i7-13620H (10 cores, 16 threads)
  - GPU: NVIDIA GeForce RTX 4060 Laptop GPU (8GB VRAM)
  - RAM: 16 GB DDR5
  - Disk: 1 TB NVMe SSD
  - **Selected Profile**: Qwen3 8B Q4_K_M (VRAM: ~5.5 GB utilized) or Qwen2.5 3B local engine.

---

## 4. Deterministic Demo Fallback (DemoDecisionSupportProvider)

### 4.1 Purpose
To guarantee **100% offline competition resilience**, PRANA includes a zero-dependency deterministic simulation engine. If neither Ollama nor GPU runtimes are initialized, or if local model inference times out, PRANA automatically and transparently falls back to `DemoDecisionSupportProvider`.

### 4.2 Behavior
- Produces deterministic, validated decision support for the 3 core competition scenarios (`PR-8492` Trauma, `PR-7104` Snakebite, `PR-9521` Poisoning).
- Explicitly flags status in UI and API as `[DemoFallback]` to ensure complete architectural transparency.

---

## 5. Architectural Comparison Matrix

| Property | System 1: LAYA | System 2: QWEN3 | Demo Fallback |
| :--- | :--- | :--- | :--- |
| **Model Role** | Fast Typed Orchestration Gate | Deep Tool-Calling & Reasoning | Offline Simulation Fallback |
| **Generative Text?** | **NO** (Typed decisions only) | **YES** (Structured JSON narrative) | **YES** (Deterministic templates) |
| **Parameter Count** | ~421M | 8B (or 4B/3B) | 0 (Heuristic engine) |
| **License** | Apache 2.0 | Apache 2.0 | MIT / Proprietary codebase |
| **Average Latency** | ~24 ms | ~45–60 ms | ~22 ms |
| **Tool Calling?** | Recommends bundle | Executes bounded loop | Executes standard sequence |
| **State Mutation** | Zero (Read-only) | Zero (Read-only) | Zero (Read-only) |
| **Failure Mode** | Bypasses to Qwen3 default | Falls back to Demo engine | Graceful UI degradation |
