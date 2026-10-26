# 🎙️ CallProbe — Voice Agent QA & Regression Platform

> **Hinglish-first QA platform for testing voice agents before launch and monitoring them after.**
> Simulates real Indian callers mixing Hindi and English across 6 realistic personas, detects policy leaks and hallucinations with multi-judge evaluators, and catches regressions between agent versions.

---

## ⚡ 60-Second Demo Walkthrough

1. **Seed the Demo Environment (One Command)**:
   ```bash
   python -m backend.seed_demo
   ```
   *This immediately creates 18 diverse Hinglish caller scenarios, registers both the flawed `v1.0.0-flawed` and hardened `v2.0.0-fixed` ApnaBank bots, and completes two simulation runs.*

2. **Launch the CallProbe Server**:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```
   Open **[http://localhost:8000](http://localhost:8000)** in your browser.

3. **Explore the Core Features**:
   - **Dashboard**: View aggregate Pass Rate, Goal Resolution %, Compliance Failure Rate, and p50/p95 latency percentiles. Notice the **Top 5 Failure Modes** clustered by the judge.
   - **Failure Explorer**: Filter transcripts by persona (*Impatient*, *Confused Elder*, *Angry*, *Noisy-Line*, *Policy Violator*, *Interrupter*). Notice the **red highlighted culprit turn** with the exact evaluator reasoning (e.g. OTP bypass or fabricated 4.5% interest rate). Click the **TTS 🔊 button** to listen to the utterance via Web Speech API!
   - **Regression Diff**: Compare **Run 1 (v1.0-flawed)** against **Run 2 (v2.0-fixed)**. Observe the side-by-side metric deltas and the list of resolved/regressed scenarios. Click **"Save Suite as Regression Suite"** to lock the scenarios for continuous regression testing.
   - **Review Queue**: Review judge decisions with one click (Agree 👍 / Disagree 👎) and monitor the live **Judge-vs-Human Agreement Rate**.

---

## 🏗️ Project Architecture & Folder Structure

```
Build with Sarvam/
├── backend/
│   ├── main.py                  # FastAPI server with all REST endpoints & static UI mount
│   ├── config.py                # Environment configuration & feature flags
│   ├── database.py              # SQLite engine & SQLAlchemy session
│   ├── models/                  # Database models (Agent, Scenario, Run, Transcript, Evaluation, Review)
│   ├── schemas/                 # Pydantic v2 validation models
│   ├── llm/                     # Provider abstraction (MockLLM + SarvamLLMClient)
│   ├── agents/                  # Webhook & Prompt connector + ApnaBank demo agents
│   ├── engine/                  # Simulation loop, 6 Hinglish personas & scenario generator
│   ├── evaluators/              # Resolution, Compliance (regex + LLM), Hallucination, Latency & Sentiment
│   ├── diff/                    # Regression delta calculator & regression detector
│   ├── seed_demo.py             # One-click demo seeder
│   ├── static/index.html        # Standalone responsive UI (Zero Node install required)
│   └── tests/                   # Pytest test suite for evaluators and regression diff
├── frontend/                    # Vite + React + Tailwind + Lucide + Recharts SPA
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── docs/                        # Architecture & API specifications
│   ├── ARCHITECTURE.md
│   └── API_SPEC.md
├── .env                         # SARVAM_API_KEY configuration
├── .gitignore                   # Excludes .env, sqlite DB, node_modules
└── README.md
```

---

## 🚀 Getting Started

### 1. Requirements
- Python 3.10+ (tested on Python 3.11 / 3.15)
- Standard browser (Chrome, Edge, Safari, Firefox)

### 2. Setup & Installation
```bash
# Clone or enter directory
cd "Build with Sarvam"

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3. Configure LLM Provider
CallProbe works **completely offline with zero API key** using the built-in `MockLLM`.

To enable live **Sarvam AI** inference:
1. Open `.env` and add your key:
   ```env
   SARVAM_API_KEY=your_sarvam_api_key_here
   ```
2. CallProbe will automatically activate `SarvamLLMClient` with `sarvam-105b-conversations` for simulation and evaluator judging!

### 4. Running Unit Tests
```bash
python -m pytest backend/tests -v
```
*7 unit tests verify Resolution, Compliance regex rules, Hallucination checks, Latency SLAs, Sentiment degradation, and Regression Diff calculation.*

---

## 🎧 Optional Audio Layer (Web Speech API)
CallProbe includes an in-browser voice synthesis layer:
- In the **Failure Explorer**, click the **TTS 🔊** button on any turn to hear the audio using the browser's native Indian English / Hindi voice synthesis.
- Controlled via `ENABLE_AUDIO_PREVIEW=true` in `backend/config.py`.

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| **Agent Connector** | Connect via Webhook (`POST {messages: [...]}`) or System Prompt. |
| **6 Hinglish Personas** | Impatient, Confused Elder, Angry, Noisy-Line, Policy Violator, Interrupter. |
| **Interruption Testing** | Truncates agent reply mid-sentence to test agent barge-in resilience. |
| **Multi-Judge Evaluators** | Resolution, Compliance (OTP/PIN leaks), Hallucination (KB comparison), Latency SLAs, and Sentiment arc. |
| **Regression Diff Engine** | Delta comparison table + list of regressions (passed on A, failed on B). |
| **Human Review Queue** | Reviewer agreement tracker measuring judge alignment. |
