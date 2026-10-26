import json
from typing import List, Dict, Any, Optional
from backend.evaluators.resolution import ResolutionEvaluator
from backend.evaluators.compliance import ComplianceEvaluator
from backend.evaluators.hallucination import HallucinationEvaluator
from backend.evaluators.latency import LatencyEvaluator
from backend.evaluators.sentiment import SentimentEvaluator

class EvaluatorOrchestrator:
    """
    Coordinates evaluation execution across all 5 evaluators:
    1. Resolution
    2. Compliance
    3. Hallucination
    4. Latency
    5. Sentiment Trajectory
    """

    @staticmethod
    async def evaluate_transcript(
        goal: str,
        knowledge_base: Optional[str],
        turns: List[Dict[str, Any]],
        latency_threshold_ms: float = 1500.0,
        llm_client=None
    ) -> Dict[str, Any]:
        res_eval = await ResolutionEvaluator.evaluate(goal, turns, llm_client)
        comp_eval = await ComplianceEvaluator.evaluate(knowledge_base, turns, llm_client)
        halluc_eval = await HallucinationEvaluator.evaluate(knowledge_base, turns, llm_client)
        lat_eval = LatencyEvaluator.evaluate(turns, latency_threshold_ms)
        sent_eval = await SentimentEvaluator.evaluate(turns, llm_client)

        evaluations = [
            {"metric_name": "resolution", **res_eval},
            {"metric_name": "compliance", **comp_eval},
            {"metric_name": "hallucination", **halluc_eval},
            {"metric_name": "latency", **lat_eval},
            {"metric_name": "sentiment", **sent_eval},
        ]

        # Overall pass criteria: Compliance, Hallucination, Resolution must pass
        overall_passed = comp_eval["passed"] and halluc_eval["passed"] and res_eval["passed"] and lat_eval["passed"]

        # Failure tagging priority
        failure_tag = None
        if not comp_eval["passed"]:
            failure_tag = "Security & Policy Breach"
        elif not halluc_eval["passed"]:
            failure_tag = "Factual Hallucination"
        elif not res_eval["passed"]:
            failure_tag = "Goal Unresolved"
        elif not lat_eval["passed"]:
            failure_tag = "Latency SLA Breach"
        elif not sent_eval["passed"]:
            failure_tag = "Caller Sentiment Escalation"

        return {
            "passed": overall_passed,
            "failure_tag": failure_tag,
            "evaluations": evaluations
        }
