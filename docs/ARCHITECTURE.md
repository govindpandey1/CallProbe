# CallProbe Architecture & System Design

CallProbe is a QA and continuous regression testing platform for conversational voice agents, engineered specifically for **Hinglish-first** caller dynamics in the Indian context.

---

## High-Level System Architecture

```
[ Developer / QA Lead ]
          │
          ▼
┌────────────────────────────────────────────────────────┐
│             CallProbe Web UI (Vite / React)            │
│  - Telemetry Dashboard & Live Run Monitor              │
│  - Failure Explorer (Turn Highlights & Culprit Reasons)│
│  - Side-by-Side Version Diff & Regression Detector     │
│  - One-Click Hinglish Scenario Batch Generator         │
│  - Human Review & Evaluator Agreement Queue            │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON)
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend Core                  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │             Async Simulation Engine              │  │
│  │  - Concurrent Caller Worker Pool (Semaphore)     │  │
│  │  - 6 Hinglish Voice Personas                     │  │
│  │  - Interruption Injection (Mid-Sentence Truncate)│  │
│  │  - Millisecond Latency Recorder                  │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │               Evaluator Pipeline                 │  │
│  │  1. Goal Resolution Evaluator (LLM Judge)        │  │
│  │  2. Compliance & Privacy (Regex + Policy Judge)  │  │
│  │  3. Factual Hallucination Evaluator (Ground KB)  │  │
│  │  4. Latency SLA Evaluator (p50 / p95)            │  │
│  │  5. Sentiment Trajectory Tracker                 │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │             LLM Provider Abstraction             │  │
│  │                 (`llm_client.py`)                │  │
│  │  - MockLLM (Deterministic, Offline, Zero-Cost)   │  │
│  │  - SarvamAI (`sarvam-105b-conversations`)        │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ SQLite (SQLAlchemy ORM)
┌───────────────────────────▼────────────────────────────┐
│                    callprobe.db                        │
│  agents | scenario_suites | scenarios | simulation_runs │
│  transcripts | evaluations | human_reviews             │
└────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Hinglish Voice Personas (`backend/engine/personas.py`)
Real Indian voice calls mix Hindi and English dynamically across code-switching spectrums:
- **Impatient Caller**: Short, irritable queries (*"Jaldi batao yaar, time nahi hai!"*).
- **Confused Elder**: Respectful Hindi (*"Beta mera ATM card gir gaya... koi paise toh nahi nikal lega?"*).
- **Angry Customer**: Aggressive Hinglish, complaints about deductions (*"Third time call kar raha hoon! 4,500 wapas karo!"*).
- **Noisy-Line Caller**: High ambient noise, dropped packets (*"...halo? \*train horn\* ...balance kitna...?"*).
- **Policy Violator**: Social engineering and sob stories (*"Emergency hai hospital mein, brother ka balance de do please."*).
- **Interrupter**: Barges in mid-turn, testing agent interruption handling.

### 2. Multi-Turn Conversation Simulation
The simulation loop runs up to 8 conversation turns between the Persona caller and the Agent (connected via Webhook or System Prompt).
When simulating interruptions, the agent's utterance is truncated mid-sentence, and the caller responds immediately to the partial utterance.

### 3. Evaluators Pipeline
- **Resolution Evaluator**: Did the caller's goal get resolved? (`yes`, `partial`, `no`).
- **Compliance Evaluator**: Rule-based regex pattern checks for OTP, PIN, and CVV disclosures + LLM policy judge against the official Knowledge Base.
- **Hallucination Evaluator**: Flags fabricated interest rates, bonuses, or fees absent from ground truth.
- **Latency Evaluator**: Measures p50 and p95 per run, flagging turns exceeding 1,500ms.
- **Sentiment Trajectory Evaluator**: Maps caller emotional valence across turns to catch unmitigated escalations.

### 4. Regression Diff Engine
Compares Run A (baseline) and Run B (candidate):
- Calculates per-metric $\Delta$ for Pass Rate, Resolution, Compliance Fails, and p95 Latency.
- Identifies true regressions: scenarios that passed on Run A but failed on Run B.
- Allows saving any scenario set as a reusable **Regression Suite**.
