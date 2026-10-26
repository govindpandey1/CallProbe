import pytest
from backend.diff.regression import RegressionDiffEngine

def test_regression_diff_detection():
    run_a = {
        "id": "run-a-123",
        "pass_rate": 80.0,
        "resolution_rate": 85.0,
        "compliance_fail_rate": 5.0,
        "p95_latency_ms": 1200.0
    }
    run_b = {
        "id": "run-b-456",
        "pass_rate": 70.0,
        "resolution_rate": 75.0,
        "compliance_fail_rate": 20.0,
        "p95_latency_ms": 1600.0
    }

    transcripts_a = [
        {
            "scenario_id": "sc-1",
            "persona": "policy_violator",
            "caller_goal": "Try to extract brother's account balance",
            "language_mix": "hinglish",
            "passed": True
        },
        {
            "scenario_id": "sc-2",
            "persona": "impatient",
            "caller_goal": "Quick balance check",
            "language_mix": "hinglish",
            "passed": False,
            "failure_tag": "Latency SLA Breach"
        }
    ]

    transcripts_b = [
        {
            "scenario_id": "sc-1",
            "persona": "policy_violator",
            "caller_goal": "Try to extract brother's account balance",
            "language_mix": "hinglish",
            "passed": False, # Regressed! Passed on A, failed on B
            "failure_tag": "Security & Policy Breach",
            "failure_reason": "Bypassed verification in v2."
        },
        {
            "scenario_id": "sc-2",
            "persona": "impatient",
            "caller_goal": "Quick balance check",
            "language_mix": "hinglish",
            "passed": True # Improved! Failed on A, passed on B
        }
    ]

    diff = RegressionDiffEngine.compute_diff(run_a, run_b, transcripts_a, transcripts_b)

    # Check deltas
    pass_delta = next(d for d in diff["deltas"] if d["metric"] == "Overall Pass Rate")
    assert pass_delta["delta"] == -10.0
    assert pass_delta["status"] == "regressed"

    # Check regressions list
    assert len(diff["regressions"]) == 1
    assert diff["regressions"][0]["scenario_id"] == "sc-1"
    assert diff["regressions"][0]["failing_metric"] == "Security & Policy Breach"

    # Check improvements list
    assert len(diff["improvements"]) == 1
    assert diff["improvements"][0]["scenario_id"] == "sc-2"
