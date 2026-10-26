from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLLMClient(ABC):
    @abstractmethod
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> str:
        """Execute chat completion and return the assistant reply string."""
        pass

    @abstractmethod
    async def chat_completion_async(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> str:
        """Async variant of chat completion."""
        pass
