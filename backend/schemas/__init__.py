import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# Agent Schemas
class AgentBase(BaseModel):
    name: str
    version: str = "v1.0.0"
    connector_type: str = "prompt" # "webhook" or "prompt"
    webhook_url: Optional[str] = None
    system_prompt: Optional[str] = None
    knowledge_base: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Scenario Schemas
class ScenarioBase(BaseModel):
    persona: str
    caller_goal: str
    language_mix: str = "hinglish"
    difficulty: int = 3
    initial_utterance: str
    metadata_json: Optional[str] = None

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioResponse(ScenarioBase):
    id: str
    suite_id: str

    class Config:
        from_attributes = True

class ScenarioSuiteBase(BaseModel):
    name: str
    domain: str = "banking"
    is_regression_suite: bool = False

class ScenarioSuiteCreate(ScenarioSuiteBase):
    pass

class ScenarioSuiteResponse(ScenarioSuiteBase):
    id: str
    created_at: datetime.datetime
    scenarios: List[ScenarioResponse] = []

    class Config:
        from_attributes = True

class GenerateScenariosRequest(BaseModel):
    domain: str = "banking"
    count: int = 50
    name: Optional[str] = None
    language_mix: Optional[str] = "hinglish"

# Evaluation Schemas
class EvaluationResponse(BaseModel):
    id: str
    transcript_id: str
    metric_name: str
    score: str
    passed: bool
    culprit_turn: Optional[int] = None
    reason: str
    raw_metadata_json: Optional[str] = None

    class Config:
        from_attributes = True

# Transcript Schemas
class TranscriptResponse(BaseModel):
    id: str
    run_id: str
    scenario_id: str
    turns_json: str
    passed: bool
    failure_tag: Optional[str] = None
    evaluations: List[EvaluationResponse] = []

    class Config:
        from_attributes = True

# Run Schemas
class SimulationRunStartRequest(BaseModel):
    agent_id: str
    suite_id: str
    concurrency: int = 5
    max_turns: int = 8

class SimulationRunResponse(BaseModel):
    id: str
    agent_id: str
    suite_id: str
    status: str
    total_scenarios: int
    completed_scenarios: int
    pass_rate: float
    resolution_rate: float
    compliance_fail_rate: float
    p50_latency_ms: float
    p95_latency_ms: float
    error_message: Optional[str] = None
    started_at: datetime.datetime
    finished_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# Regression Diff Schemas
class RegressionDelta(BaseModel):
    metric: str
    run_a: float
    run_b: float
    delta: float
    status: str # "improved", "regressed", "neutral"

class RegressedScenarioItem(BaseModel):
    scenario_id: str
    persona: str
    caller_goal: str
    language_mix: str
    run_a_passed: bool
    run_b_passed: bool
    failing_metric: Optional[str] = None
    failing_reason: Optional[str] = None

class RegressionDiffResponse(BaseModel):
    run_a_id: str
    run_b_id: str
    deltas: List[RegressionDelta]
    regressions: List[RegressedScenarioItem]
    improvements: List[RegressedScenarioItem]

# Human Review Schemas
class HumanReviewCreate(BaseModel):
    evaluation_id: str
    reviewer_decision: str # "agree", "disagree"
    reviewer_notes: Optional[str] = None

class HumanReviewResponse(BaseModel):
    id: str
    evaluation_id: str
    reviewer_decision: str
    reviewer_notes: Optional[str] = None
    reviewed_at: datetime.datetime

    class Config:
        from_attributes = True
