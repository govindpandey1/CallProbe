import os
from typing import List, Dict, Any, Optional
from backend.llm.base import BaseLLMClient
from backend.config import SARVAM_API_KEY

class SarvamLLMClient(BaseLLMClient):
    """
    Client for Sarvam AI chat completions using the official sarvamai SDK.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or SARVAM_API_KEY
        if not self.api_key:
            raise ValueError("SARVAM_API_KEY is not set.")
        from sarvamai import SarvamAI
        self.client = SarvamAI(api_subscription_key=self.api_key)
        self.default_model = "sarvam-105b-conversations"

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> str:
        model_name = model or self.default_model
        # Format messages for Sarvam chat API
        formatted_messages = [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in messages
        ]
        response = self.client.chat.completions(
            model=model_name,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content or ""
        return ""

    async def chat_completion_async(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> str:
        # Wrap sync SDK call in thread executor for async compatibility
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.chat_completion(messages, model, temperature, max_tokens)
        )
