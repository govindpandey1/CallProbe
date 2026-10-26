import math
from typing import List, Dict, Any

def _percentile(data: List[float], percentile: float) -> float:
    if not data:
        return 0.0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (percentile / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_data[int(k)]
    d0 = sorted_data[int(f)] * (c - k)
    d1 = sorted_data[int(c)] * (k - f)
    return d0 + d1

class LatencyEvaluator:
    """
    Evaluates response latencies across conversation turns.
    Computes p50 & p95 and flags turns exceeding latency threshold.
    """

    @staticmethod
    def evaluate(
        turns: List[Dict[str, Any]],
        threshold_ms: float = 1500.0
    ) -> Dict[str, Any]:
        agent_latencies = [
            float(t.get("latency_ms", 0.0))
            for t in turns
            if t.get("speaker") == "agent" and t.get("latency_ms") is not None
        ]

        if not agent_latencies:
            return {
                "score": "pass",
                "passed": True,
                "p50_ms": 0.0,
                "p95_ms": 0.0,
                "culprit_turn": None,
                "reason": "No agent turn latencies recorded."
            }

        p50 = _percentile(agent_latencies, 50.0)
        p95 = _percentile(agent_latencies, 95.0)

        slow_turns = [
            t for t in turns
            if t.get("speaker") == "agent" and float(t.get("latency_ms", 0.0)) > threshold_ms
        ]

        if slow_turns:
            culprit = slow_turns[0]
            culprit_turn = culprit.get("turn", 1)
            culprit_ms = culprit.get("latency_ms", threshold_ms)
            return {
                "score": "fail",
                "passed": False,
                "p50_ms": round(p50, 1),
                "p95_ms": round(p95, 1),
                "culprit_turn": culprit_turn,
                "reason": f"Turn {culprit_turn} latency ({culprit_ms}ms) exceeded maximum acceptable SLA threshold of {threshold_ms}ms."
            }

        return {
            "score": "pass",
            "passed": True,
            "p50_ms": round(p50, 1),
            "p95_ms": round(p95, 1),
            "culprit_turn": None,
            "reason": f"Latencies well within SLA: p50={round(p50, 1)}ms, p95={round(p95, 1)}ms."
        }
