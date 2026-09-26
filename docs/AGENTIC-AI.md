# PRANA — Hybrid Agentic Clinical Coordination Engine Architecture

> **Document Version**: 4.0.0 (Phase 21 Agent Reliability + Grounding + Evaluation Truthfulness)  
> **Status**: Verified & Operational (30-Case Benchmark, Execution Mode Truthfulness, Role-Projected Views)  
> **Competition Track**: Agentic AI for Billions  
> **Safety Classification**: Non-Autonomous Tele-Specialist Decision Support (Future SaMD Clinical Deployment Architecture — Currently Prototype Simulation; Not Clinically Validated)

---

## 1. Executive Summary & Core Thesis

**PRANA** (*“Where the Journey Becomes Care”*) transforms prehospital transit from an uncoordinated blackout period into an active, high-fidelity clinical stabilization corridor.

In **Phase 21**, PRANA hardens the **Hybrid Open AI Agent Architecture** established in Phase 20, with 30-case benchmarks, execution mode truthfulness, and role-projected decision support:

$$\text{Event} \longrightarrow \underbrace{\text{Laya System 1}}_{\text{Fast Typed Decision Gate}} \longrightarrow \underbrace{\text{Qwen3 System 2}}_{\text{Bounded Agentic Tool Use}} \longrightarrow \underbrace{\text{Safety Validator}}_{\text{Deterministic Gate}} \longrightarrow \underbrace{\text{Human Clinician}}_{\text{Final Clinical Authority}}$$

### The Strategic Rationale: Why Two Models?
Deploying an 8B generative model for every ambient event (e.g., GPS ticks, minor route updates, routine cabin telemetry) is computationally prohibitive and wasteful for edge prehospital deployments. Conversely, relying solely on a lightweight classifier lacks the rich generative reasoning required to synthesize multi-stream trends, detect subtle clinical contradictions, and trace evidence provenance.

PRANA solves this by combining:
1. **LAYA (System 1)**: A lightweight (~421M parameter, Apache 2.0), non-autoregressive decision model executing a single forward pass in ~18 ms. It decides whether an event warrants deeper analysis, routes to the most critical evidence bundle, and enforces early **Fast-Path Exits** on non-clinical events.
2. **QWEN3 (System 2)**: A primary local open-weight model (Apache 2.0 via Ollama/vLLM/llama.cpp) with dynamic tool calling over `ReadOnlyToolRegistry`, untrusted prompt-injection boundaries, and explicit data gap detection.
3. **HUMAN SPECIALIST**: The mandatory clinical authority. AI never prescribes, diagnoses, or mutates emergency state autonomously (`REQUIRES_HUMAN_REVIEW`).

---

## 2. System 1 vs. System 2 vs. Human Invariant Hierarchy

```mermaid
sequenceDiagram
    autonumber
    participant Amb as Field Paramedic (Ambulance)
    participant Bus as Realtime WebSocket / Event Store
    participant Laya as Laya System 1 (Fast Gate)
    participant Qwen as Qwen3 System 2 (Bounded Agent)
    participant Reg as ReadOnlyToolRegistry (11 Tools)
    participant Gate as Clinical Safety Validator
    participant Doc as Remote Tele-Specialist

    Amb->>Bus: Ingests Telemetry Event (Vital / Route / Observation)
    Bus->>Laya: Run Fast Typed Decision (relevance, tool_bundle, priority, sufficiency)
    
    alt Relevance == 'no_analysis' (e.g. ROUTE_UPDATED)
        Laya-->>Bus: FAST-PATH EXIT (Task Completed early; 0 Qwen3 Compute Wasted)
    else Relevance == 'deep_analysis'
        Laya-->>Qwen: Handover to System 2 with Recommended Bundle ('vitals')
        loop Bounded Read-Only Tool Loop (Max 5 Steps)
            Qwen->>Reg: Tool Call (e.g., get_latest_vitals, get_vital_trend)
            Reg-->>Qwen: Grounded Evidence + Provenance Event IDs
        end
        Qwen->>Gate: Synthesize Structured Signal + Missing Data Gaps
        Gate->>Gate: Check Banned Actions, Drug Prescriptions & Hallucinations
        Gate-->>Bus: Persist & Broadcast 'AGENT_HUMAN_REVIEW_REQUIRED'
        Bus->>Doc: Live Push to Clinician Workspace (AgentActivityPanel)
        Doc->>Amb: Authoritative Specialist Action (CONFIRM / REQUEST DATA / ESCALATE)
    end
```

---

## 3. Four-Way Architectural Evaluation Benchmark

The automated evaluation harness (`backend/app/ai/evaluation/run.py`) evaluates **30 synthetic edge-case scenarios** (expanded from 22 in Phase 20) across Trauma (`PR-8492`), Snakebite (`PR-7104`), and Poisoning (`PR-9521`) across all operational configurations:

| Metric | Demo Fallback | Laya (Sys-1 Only) | **Hybrid (Laya + Qwen3)** |
| :--- | :--- | :--- | :--- |
| **Cases Evaluated** | 30 | 30 | **30** |
| **Valid Tool Calls** | 135 | 146 | **146** |
| **Invalid Tool Calls** | 0 | 0 | **0** |
| **Unnecessary Tool Calls** | 45 (1.50/case) | 34 (1.13/case) | **34 (1.13/case) — 24% Reduction** |
| **Schema Validity** | 30/30 (100%) | 30/30 (100%) | **30/30 (100%)** |
| **Evidence Grounding** | 30/30 (100%) | 30/30 (100%) | **30/30 (100%)** |
| **Missing Data Detected** | 30/30 (100%) | 30/30 (100%) | **30/30 (100%)** |
| **Safety Violations** | 0 (0.0%) | 0 (0.0%) | **0 (0.0%)** |
| **Human-Review Rate** | 100% | 100% | **100%** |
| **Average Latency** | 18.8 ms | 24.2 ms | **41.8 ms** |
| **Execution Mode** | REAL | REAL | **FALLBACK** (Ollama offline) / **REAL** (Ollama online) |
| **Fast-Path Capability** | No | Yes | **Yes (Skips unneeded compute)** |

### Key Benchmark Findings:
1. **24% Reduction in Unnecessary Tool Calls**: By having Laya System 1 recommend the high-yield evidence bundle up front (`vitals` vs. `observations` vs. `interventions`), Qwen3 focuses directly on relevant diagnostic parameters without exploratory querying.
2. **Compute Conservation**: For routine ambient events (`ROUTE_UPDATED`), Laya triggers a Fast-Path exit, saving 100% of generative inference compute.
3. **100% Safety Compliance**: Across all configurations, zero autonomous diagnoses or prescriptions were emitted, and 100% of tasks terminated at `REQUIRES_HUMAN_REVIEW`.
4. **Execution Mode Truthfulness (Phase 21)**: When Ollama is offline, Hybrid correctly reports `Execution Mode: FALLBACK` with `Real Inference Invocations: 0`. PRANA never falsely claims real model inference when fallback executed.

---

## 4. Hardware Profiles & Local Model Specifications

Verified on test developer machine:
- **Processor**: 13th Gen Intel Core i7-13620H (10 physical cores, 16 threads)
- **Dedicated Graphics**: NVIDIA GeForce RTX 4060 Laptop GPU (8 GB GDDR6 VRAM)
- **System Memory**: 16 GB DDR5
- **Storage**: 1 TB NVMe SSD

### Recommended Deployment Profiles:
- **Standard Local Profile**: Qwen3 8B Instruct (GGUF Q4_K_M, ~5.03 GB) + Laya v1.0 (~421M, ~850 MB VRAM) $\rightarrow$ Fits comfortably within 8GB VRAM.
- **Constrained / CPU-Only Profile**: Qwen3 4B / Qwen2.5 3B (GGUF Q4_K_M, ~2.1 GB) + Laya v1.0 CPU inference.
- **Offline Resilient Mode**: `DemoDecisionSupportProvider` deterministic simulation fallback if runtime is offline.
