from typing import List, Dict, Any, Optional

class RegressionDiffEngine:
    """
    Computes comparative metrics between two runs (Run A = baseline, Run B = candidate).
    Identifies:
    1. Metric deltas (pass rate, resolution rate, compliance failure rate, p50, p95)
    2. True regressions: scenarios that passed on A but failed on B
    3. Improvements: scenarios that failed on A but passed on B
    """

    @staticmethod
    def compute_diff(
        run_a: Dict[str, Any],
        run_b: Dict[str, Any],
        transcripts_a: List[Dict[str, Any]],
        transcripts_b: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        # Metric deltas
        deltas = [
            {
                "metric": "Overall Pass Rate",
                "run_a": round(run_a.get("pass_rate", 0.0), 1),
                "run_b": round(run_b.get("pass_rate", 0.0), 1),
                "delta": round(run_b.get("pass_rate", 0.0) - run_a.get("pass_rate", 0.0), 1),
                "status": "improved" if run_b.get("pass_rate", 0.0) > run_a.get("pass_rate", 0.0)
                          else ("regressed" if run_b.get("pass_rate", 0.0) < run_a.get("pass_rate", 0.0) else "neutral")
            },
            {
                "metric": "Goal Resolution Rate",
                "run_a": round(run_a.get("resolution_rate", 0.0), 1),
                "run_b": round(run_b.get("resolution_rate", 0.0), 1),
                "delta": round(run_b.get("resolution_rate", 0.0) - run_a.get("resolution_rate", 0.0), 1),
                "status": "improved" if run_b.get("resolution_rate", 0.0) > run_a.get("resolution_rate", 0.0)
                          else ("regressed" if run_b.get("resolution_rate", 0.0) < run_a.get("resolution_rate", 0.0) else "neutral")
            },
            {
                "metric": "Compliance Failure Rate",
                "run_a": round(run_a.get("compliance_fail_rate", 0.0), 1),
                "run_b": round(run_b.get("compliance_fail_rate", 0.0), 1),
                "delta": round(run_b.get("compliance_fail_rate", 0.0) - run_a.get("compliance_fail_rate", 0.0), 1),
                # For failures, a lower rate is an improvement!
                "status": "improved" if run_b.get("compliance_fail_rate", 0.0) < run_a.get("compliance_fail_rate", 0.0)
                          else ("regressed" if run_b.get("compliance_fail_rate", 0.0) > run_a.get("compliance_fail_rate", 0.0) else "neutral")
            },
            {
                "metric": "p95 Latency (ms)",
                "run_a": round(run_a.get("p95_latency_ms", 0.0), 1),
                "run_b": round(run_b.get("p95_latency_ms", 0.0), 1),
                "delta": round(run_b.get("p95_latency_ms", 0.0) - run_a.get("p95_latency_ms", 0.0), 1),
                # For latency, lower is better
                "status": "improved" if run_b.get("p95_latency_ms", 0.0) < run_a.get("p95_latency_ms", 0.0)
                          else ("regressed" if run_b.get("p95_latency_ms", 0.0) > run_a.get("p95_latency_ms", 0.0) else "neutral")
            }
        ]

        # Index transcripts by scenario_id
        map_a = {t.get("scenario_id"): t for t in transcripts_a}
        map_b = {t.get("scenario_id"): t for t in transcripts_b}

        common_scenario_ids = set(map_a.keys()).intersection(set(map_b.keys()))

        regressions = []
        improvements = []

        for sid in common_scenario_ids:
            ta = map_a[sid]
            tb = map_b[sid]

            passed_a = ta.get("passed", False)
            passed_b = tb.get("passed", False)

            if passed_a and not passed_b:
                # Regressed
                regressions.append({
                    "scenario_id": sid,
                    "persona": tb.get("persona", "Unknown"),
                    "caller_goal": tb.get("caller_goal", "N/A"),
                    "language_mix": tb.get("language_mix", "hinglish"),
                    "run_a_passed": True,
                    "run_b_passed": False,
                    "failing_metric": tb.get("failure_tag", "Evaluation Failure"),
                    "failing_reason": tb.get("failure_reason", "Passed on Run A, but failed on Run B.")
                })
            elif not passed_a and passed_b:
                # Improved
                improvements.append({
                    "scenario_id": sid,
                    "persona": tb.get("persona", "Unknown"),
                    "caller_goal": tb.get("caller_goal", "N/A"),
                    "language_mix": tb.get("language_mix", "hinglish"),
                    "run_a_passed": False,
                    "run_b_passed": True,
                    "failing_metric": None,
                    "failing_reason": "Previously failed on Run A, resolved in Run B."
                })

        return {
            "run_a_id": run_a.get("id"),
            "run_b_id": run_b.get("id"),
            "deltas": deltas,
            "regressions": regressions,
            "improvements": improvements
        }
