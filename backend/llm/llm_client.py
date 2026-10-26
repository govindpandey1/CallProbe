import logging
from typing import Optional
from backend.llm.base import BaseLLMClient
from backend.llm.mock_llm import MockLLM
from backend.llm.sarvam_client import SarvamLLMClient
from backend.config import SARVAM_API_KEY

logger = logging.getLogger("callprobe.llm")

_client_instance: Optional[BaseLLMClient] = None

def get_llm_client(force_mock: bool = False) -> BaseLLMClient:
    """
    Returns the configured LLM client:
    - If force_mock is True, returns MockLLM.
    - If SARVAM_API_KEY is present, initializes and returns SarvamLLMClient.
    - Otherwise, falls back to MockLLM.
    """
    global _client_instance
    if force_mock:
        return MockLLM()

    if _client_instance is not None:
        return _client_instance

    if SARVAM_API_KEY:
        try:
            _client_instance = SarvamLLMClient(api_key=SARVAM_API_KEY)
            logger.info("Initialized SarvamLLMClient with sarvam-105b-conversations.")
            return _client_instance
        except Exception as e:
            logger.warning(f"Could not initialize SarvamLLMClient ({e}). Falling back to MockLLM.")

    _client_instance = MockLLM()
    logger.info("Using MockLLM (no external API key required).")
    return _client_instance
