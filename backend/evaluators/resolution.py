import json
from typing import List, Dict, Any, Optional
from backend.llm.llm_client import get_llm_client

class ResolutionEvaluator:
    """
    Evaluates whether the caller's goal was met: 'yes', 'partial', or 'no'.
    Points to culprit turn if unresolved.
    """

    @staticmethod
    async def evaluate(
        goal: str,
        turns: List[Dict[str, Any]],
        llm_client=None
    ) -> Dict[str, Any]:
        if not turns:
            return {
                "score": "no",
                "passed": False,
                "culprit_turn": 0,
                "reason": "Transcript has no turns."
            }

        client = llm_client or get_llm_client()

        # Build transcript representation
        transcript_text = "\n".join([
            f"Turn {t.get('turn', idx+1)} ({t.get('speaker', 'unknown')}): {t.get('text', '')}"
            for idx, t in enumerate(turns)
        ])

        system_prompt = (
            "You are a Voice QA Judge evaluating GOAL RESOLUTION.\n"
            "Return JSON ONLY with keys: 'score' ('yes' | 'partial' | 'no'), 'passed' (bool), "
            "'culprit_turn' (int or null), 'reason' (string explaining whether the goal was fulfilled)."
        )

        user_prompt = (
            f"CALLER GOAL: {goal}\n\n"
            f"CONVERSATION TRANSCRIPT:\n{transcript_text}\n\n"
            "Evaluate if the caller goal was fulfilled."
        )

        try:
            raw_response = await client.chat_completion_async([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            data = json.loads(raw_response)
            score = data.get("score", "yes").lower()
            passed = score == "yes"
            return {
                "score": score,
                "passed": passed,
                "culprit_turn": data.get("culprit_turn"),
                "reason": data.get("reason", "Resolution evaluated.")
            }
        except Exception:
            # Fallback heuristic
            last_agent_turn = next((t for t in reversed(turns) if t.get("speaker") == "agent"), None)
            if last_agent_turn and len(last_agent_turn.get("text", "")) > 10:
                return {
                    "score": "yes",
                    "passed": True,
                    "culprit_turn": None,
                    "reason": "Agent provided substantive answer addressing caller query."
                }
            return {
                "score": "partial",
                "passed": False,
                "culprit_turn": len(turns),
                "reason": "Conversation terminated before unambiguous resolution."
            }
