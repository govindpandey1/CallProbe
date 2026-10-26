import json
from typing import List, Dict, Any, Optional
from backend.llm.llm_client import get_llm_client

class SentimentEvaluator:
    """
    Evaluates caller sentiment trajectory (positive, neutral, negative)
    across each caller turn to catch escalations or frustration.
    """

    NEGATIVE_KEYWORDS = ["bakwas", "ridiculous", "ghatiya", "angry", "chori", "police", "kat gaye", "fraud", "scam"]
    POSITIVE_KEYWORDS = ["dhanyawad", "thank you", "shukriya", "bahut badhiya", "helpful", "great"]

    @classmethod
    async def evaluate(
        cls,
        turns: List[Dict[str, Any]],
        llm_client=None
    ) -> Dict[str, Any]:
        caller_turns = [t for t in turns if t.get("speaker") == "caller"]
        if not caller_turns:
            return {
                "score": "neutral",
                "passed": True,
                "culprit_turn": None,
                "trajectory": [],
                "reason": "No caller turns to assess."
            }

        trajectory = []
        culprit_turn = None
        has_severe_negative = False

        for t in caller_turns:
            text = t.get("text", "").lower()
            if any(k in text for k in cls.NEGATIVE_KEYWORDS):
                trajectory.append("negative")
                if culprit_turn is None:
                    culprit_turn = t.get("turn", 1)
                has_severe_negative = True
            elif any(k in text for k in cls.POSITIVE_KEYWORDS):
                trajectory.append("positive")
            else:
                trajectory.append("neutral")

        # Did it finish positive or neutral?
        end_sentiment = trajectory[-1] if trajectory else "neutral"
        passed = end_sentiment in ("positive", "neutral")

        if not passed:
            reason = f"Caller finished conversation in an agitated/negative emotional state ({' -> '.join(trajectory)})."
        else:
            reason = f"Sentiment trajectory remained stable or recovered: {' -> '.join(trajectory)}."

        return {
            "score": end_sentiment,
            "passed": passed,
            "culprit_turn": culprit_turn if not passed else None,
            "trajectory": trajectory,
            "reason": reason
        }
