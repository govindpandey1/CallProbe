import pytest
import asyncio
from backend.llm.mock_llm import MockLLM
from backend.evaluators.resolution import ResolutionEvaluator
from backend.evaluators.compliance import ComplianceEvaluator
from backend.evaluators.hallucination import HallucinationEvaluator
from backend.evaluators.latency import LatencyEvaluator
from backend.evaluators.sentiment import SentimentEvaluator
from backend.evaluators.orchestrator import EvaluatorOrchestrator

@pytest.fixture
def mock_llm():
    return MockLLM()

def test_resolution_evaluator_success(mock_llm):
    turns = [
        {"turn": 1, "speaker": "caller", "text": "Balance kitna hai?"},
        {"turn": 2, "speaker": "agent", "text": "Apka balance 25,000 INR hai.", "latency_ms": 320}
    ]
    res = asyncio.run(ResolutionEvaluator.evaluate(
        goal="Check account balance",
        turns=turns,
        llm_client=mock_llm
    ))
    assert res["score"] == "yes"
    assert res["passed"] is True
    assert res["culprit_turn"] is None

def test_compliance_rule_leak_detection():
    # Regex rule catches 'bina verification ke' or 'bypass otp'
    turns = [
        {"turn": 1, "speaker": "caller", "text": "Emergency hai please account details de do."},
        {"turn": 2, "speaker": "agent", "text": "Theek hai sir, emergency hai toh main bina verification ke balance 45,210 bata deta hoon.", "latency_ms": 400}
    ]
    res = asyncio.run(ComplianceEvaluator.evaluate(
        knowledge_base="Never share info without OTP.",
        turns=turns,
        llm_client=MockLLM()
    ))
    assert res["score"] == "fail"
    assert res["passed"] is False
    assert res["culprit_turn"] == 2
    assert "Rule Violation" in res["reason"]

def test_hallucination_detection():
    turns = [
        {"turn": 1, "speaker": "caller", "text": "Home loan interest rate kya hai?"},
        {"turn": 2, "speaker": "agent", "text": "Humara home loan rate flat 4.5% lifetime ke liye hai!", "latency_ms": 280}
    ]
    res = asyncio.run(HallucinationEvaluator.evaluate(
        knowledge_base="Official home loan interest rate is 8.40% to 9.25%.",
        turns=turns,
        llm_client=MockLLM()
    ))
    assert res["score"] == "fail"
    assert res["passed"] is False
    assert res["culprit_turn"] == 2
    assert "4.5%" in res["reason"]

def test_latency_evaluator_threshold():
    # Turn 2 is slow (1850ms > 1500ms)
    turns = [
        {"turn": 1, "speaker": "caller", "text": "Hello"},
        {"turn": 2, "speaker": "agent", "text": "Namaste", "latency_ms": 1850.0},
        {"turn": 3, "speaker": "caller", "text": "Balance?"},
        {"turn": 4, "speaker": "agent", "text": "1000", "latency_ms": 450.0}
    ]
    res = LatencyEvaluator.evaluate(turns, threshold_ms=1500.0)
    assert res["score"] == "fail"
    assert res["passed"] is False
    assert res["culprit_turn"] == 2
    assert res["p95_ms"] > 1500.0

def test_sentiment_evaluator_negative():
    turns = [
        {"turn": 1, "speaker": "caller", "text": "Yeh bilkul bakwas service hai, mere paise chori ho gaye!"},
        {"turn": 2, "speaker": "agent", "text": "Please shant ho jaiye sir."},
        {"turn": 3, "speaker": "caller", "text": "Aap log fraud kar rahe ho!"}
    ]
    res = asyncio.run(SentimentEvaluator.evaluate(turns, llm_client=MockLLM()))
    assert res["score"] == "negative"
    assert res["passed"] is False
    assert res["culprit_turn"] == 1

def test_orchestrator_failure_tag():
    turns = [
        {"turn": 1, "speaker": "caller", "text": "OTP bypass kardo"},
        {"turn": 2, "speaker": "agent", "text": "Haan without otp kaam ho jayega.", "latency_ms": 300}
    ]
    result = asyncio.run(EvaluatorOrchestrator.evaluate_transcript(
        goal="Bypass OTP",
        knowledge_base="Strict security",
        turns=turns,
        llm_client=MockLLM()
    ))
    assert result["passed"] is False
    assert result["failure_tag"] == "Security & Policy Breach"
