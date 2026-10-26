# CallProbe REST API Specification

Base URL: `http://localhost:8000/api`

---

## 1. System & Health

### `GET /api/health`
Returns system status and Sarvam AI connection state.
```json
{
  "status": "online",
  "sarvam_connected": true,
  "audio_preview_enabled": true,
  "timestamp": "2026-10-26T17:15:00.000000"
}
```

---

## 2. Agents

### `GET /api/agents`
List all registered voice agents.

### `POST /api/agents`
Register an agent via Webhook URL or System Prompt.
```json
{
  "name": "ApnaBank Voice Assistant",
  "version": "v1.2.0-candidate",
  "connector_type": "prompt",
  "system_prompt": "You are a customer support voice bot for ApnaBank...",
  "knowledge_base": "Official rules and policies..."
}
```

### `POST /api/agents/init-demo`
Initializes both flawed v1.0 and hardened v2.0 ApnaBank demo agents.

---

## 3. Scenarios & Suites

### `GET /api/suites`
List all scenario suites.

### `POST /api/scenarios/generate`
Synthesizes $N$ Hinglish scenarios (default 50) from a domain description.
```json
{
  "domain": "banking",
  "count": 50,
  "name": "Core Banking Hinglish Suite",
  "language_mix": "hinglish"
}
```

---

## 4. Simulation Runs

### `GET /api/runs`
List all historical simulation runs with aggregate metrics.

### `POST /api/runs/start`
Starts a concurrent simulation run in the background.
```json
{
  "agent_id": "378d4fa1-8696-4d1e-8f25-37e3e16ba296",
  "suite_id": "e2222800-1b03-42f0-8737-b8a85247ac4a",
  "concurrency": 5,
  "max_turns": 8
}
```

### `GET /api/runs/{run_id}/transcripts`
Filter conversations by `persona`, `language`, `difficulty`, or `failure_tag`.

### `GET /api/runs/{run_id}/failure-clusters`
Returns top 5 failure modes grouped by LLM tag with case counts and percentages.

---

## 5. Regression Diff

### `GET /api/runs/diff?run_a={id}&run_b={id}`
Computes side-by-side metric deltas and returns regressions (passed on A, failed on B).

### `POST /api/runs/{run_id}/save-as-regression-suite`
Flags the scenario suite as a permanent regression suite for recurring CI/CD checks.

---

## 6. Human Review Queue

### `POST /api/reviews`
Submit human agreement/disagreement on an evaluator score.
```json
{
  "evaluation_id": "eval-uuid-1234",
  "reviewer_decision": "agree",
  "reviewer_notes": "Auditor verified OTP disclosure."
}
```

### `GET /api/reviews/stats`
Returns judge-vs-human agreement rate and recent review records.
