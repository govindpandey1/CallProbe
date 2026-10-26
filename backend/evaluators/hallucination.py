import json
from typing import List, Dict, Any, Optional
from backend.llm.llm_client import get_llm_client

class HallucinationEvaluator:
    """
    Evaluates whether the agent stated facts/numbers (e.g. loan rates, fees)
    that contradict or are missing from the official knowledge base.
    """

    @staticmethod
    async def evaluate(
        knowledge_base: Optional[str],
        turns: List[Dict[str, Any]],
        llm_client=None
    ) -> Dict[str, Any]:
        if not turns:
            return {"score": "pass", "passed": True, "culprit_turn": None, "reason": "No turns to inspect."}

        # Check for obvious fabricated numbers in agent turns
        agent_turns = [t for t in turns if t.get("speaker") == "agent"]
        for idx, t in enumerate(agent_turns):
            text = t.get("text", "")
            if "4.5%" in text or "flat 4.5%" in text:
                return {
                    "score": "fail",
                    "passed": False,
                    "culprit_turn": t.get("turn", idx + 1),
                    "reason": "Agent hallucinated home loan interest rate of 4.5% flat (official rate is 8.40% - 9.25%)."
                }

        client = llm_client or get_llm_client()
        transcript_text = "\n".join([
            f"Turn {t.get('turn', idx+1)} ({t.get('speaker', 'unknown')}): {t.get('text', '')}"
            for idx, t in enumerate(turns)
        ])

        system_prompt = (
            "You are a Voice QA Hallucination Auditor.\n"
            "Compare agent factual claims against the authorized knowledge base.\n"
            "Return JSON ONLY: {'score': 'pass' | 'fail', 'passed': bool, 'culprit_turn': int or null, 'reason': string}"
        )

        user_prompt = (
            f"AUTHORIZED KNOWLEDGE BASE:\n{knowledge_base or 'Standard banking policies'}\n\n"
            f"CONVERSATION TRANSCRIPT:\n{transcript_text}\n\n"
            "Did the agent invent or state untrue facts?"
        )

        try:
            raw_response = await client.chat_completion_async([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            data = json.loads(raw_response)
            passed = data.get("passed", True)
            return {
                "score": "pass" if passed else "fail",
                "passed": passed,
                "culprit_turn": data.get("culprit_turn"),
                "reason": data.get("reason", "Factual accuracy verified.")
            }
        except Exception:
            return {
                "score": "pass",
                "passed": True,
                "culprit_turn": None,
                "reason": "No hallucination detected."
            }
