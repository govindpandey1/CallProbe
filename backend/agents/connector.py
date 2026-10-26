import time
from typing import List, Dict, Any, Optional
import httpx
from backend.llm.llm_client import get_llm_client

class AgentConnector:
    """
    Connects to a voice agent either via Webhook or via System Prompt run through LLM client.
    """

    @staticmethod
    async def invoke(
        connector_type: str,
        webhook_url: Optional[str],
        system_prompt: Optional[str],
        knowledge_base: Optional[str],
        messages: List[Dict[str, str]],
        timeout_seconds: float = 10.0,
    ) -> Dict[str, Any]:
        """
        Executes an agent turn and returns:
        {
            "reply": str,
            "latency_ms": float,
            "error": Optional[str]
        }
        """
        start_time = time.time()

        if connector_type == "webhook":
            if not webhook_url:
                return {
                    "reply": "",
                    "latency_ms": 0.0,
                    "error": "No webhook URL provided for webhook connector."
                }
            try:
                async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                    resp = await client.post(webhook_url, json={"messages": messages})
                    resp.raise_for_status()
                    data = resp.json()
                    reply = data.get("reply", "")
                    latency_ms = (time.time() - start_time) * 1000.0
                    return {"reply": reply, "latency_ms": round(latency_ms, 1), "error": None}
            except Exception as e:
                latency_ms = (time.time() - start_time) * 1000.0
                return {"reply": "", "latency_ms": round(latency_ms, 1), "error": str(e)}

        # Default: System prompt invocation
        prompt_full = system_prompt or "You are a helpful customer support voice agent."
        if knowledge_base:
            prompt_full += f"\n\nAuthoritative Knowledge Base & Policies:\n{knowledge_base}"

        llm_messages = [{"role": "system", "content": prompt_full}]
        llm_messages.extend(messages)

        client = get_llm_client()
        try:
            reply = await client.chat_completion_async(llm_messages)
            latency_ms = (time.time() - start_time) * 1000.0
            return {"reply": reply, "latency_ms": round(latency_ms, 1), "error": None}
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000.0
            return {"reply": "", "latency_ms": round(latency_ms, 1), "error": str(e)}
