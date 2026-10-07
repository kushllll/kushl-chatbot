import json
import logging
from typing import AsyncGenerator, Dict, List
import httpx
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are Kushal Chat AI, a helpful, intelligent, concise, and direct AI assistant. "
    "Provide clear, accurate, and thoughtfully formatted responses."
)


class OpenRouterService:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.default_model = settings.OPENROUTER_MODEL

    async def stream_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams completions token-by-token from OpenRouter.
        Yields raw content delta strings.
        """
        if not self.api_key:
            logger.error("OpenRouter API key is not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI provider is not configured. Please set OPENROUTER_API_KEY."
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://kushalchat.ai",
            "X-Title": "Kushal Chat AI",
        }

        # Prepend system prompt if not present
        formatted_messages = []
        if not messages or messages[0].get("role") != "system":
            formatted_messages.append({"role": "system", "content": SYSTEM_PROMPT})
        formatted_messages.extend(messages)

        payload = {
            "model": model or self.default_model,
            "messages": formatted_messages,
            "stream": True,
            "temperature": 0.7,
            "max_tokens": 4000,
        }

        url = f"{self.base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        logger.error("OpenRouter API error %s: %s", response.status_code, error_body.decode("utf-8", errors="ignore"))
                        try:
                            err_json = json.loads(error_body)
                            err_msg = err_json.get("error", {}).get("message") or str(err_json)
                        except Exception:
                            err_msg = error_body.decode("utf-8", errors="ignore")
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"OpenRouter API error: {err_msg}"
                        )

                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                data_json = json.loads(data_str)
                                choices = data_json.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
            except httpx.TimeoutException:
                logger.error("OpenRouter request timed out")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="AI provider request timed out. Please try again."
                )
            except httpx.RequestError as exc:
                logger.error("Network error communicating with OpenRouter: %s", exc)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Network error communicating with AI provider: {str(exc)}"
                )


openrouter_service = OpenRouterService()
