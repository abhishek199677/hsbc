"""
Async HTTP client for calling Next.js API routes from the LiveKit agent.

The agent routes all LLM logic through the existing /api/ai-interview endpoint
so that adaptive difficulty, prompt injection defense, and evaluation logic
stay centralized in one place.
"""

import os
import logging
import httpx

logger = logging.getLogger("agent.nextjs")

NEXTJS_BASE_URL = os.getenv("NEXTJS_BASE_URL", "http://localhost:3000")
REQUEST_TIMEOUT = 30.0


async def _call_ai_interview(action: str, auth_token: str, **extra) -> dict:
    """POST to /api/ai-interview with the given action."""
    payload = {"action": action, **extra}
    headers = {}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{NEXTJS_BASE_URL}/api/ai-interview",
                json=payload,
                headers=headers,
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("AI interview API returned %s: %s", exc.response.status_code, exc.response.text)
        return {"success": False, "error": f"HTTP {exc.response.status_code}"}
    except httpx.RequestError as exc:
        logger.error("Failed to reach AI interview API: %s", exc)
        return {"success": False, "error": str(exc)}


async def start_interview(auth_token: str, profile: dict) -> dict:
    """Start a new interview — generates intro + first question."""
    return await _call_ai_interview("start", auth_token, profile=profile)


async def get_coding_challenge(auth_token: str, difficulty: str | None = None) -> dict:
    """Fetch the coding challenge so it can be read aloud in a voice interview."""
    extra: dict = {}
    if difficulty:
        extra["difficulty"] = difficulty
    return await _call_ai_interview("coding_challenge", auth_token, **extra)


async def respond_to_candidate(
    auth_token: str,
    user_message: str,
    conversation_history: list[dict],
    interview_state: dict | None = None,
) -> dict:
    """Send the candidate's answer and get the next AI response."""
    kwargs = {
        "userMessage": user_message,
        "conversationHistory": conversation_history,
    }
    if interview_state:
        kwargs["interviewState"] = interview_state
    return await _call_ai_interview("respond", auth_token, **kwargs)


async def evaluate_interview(
    auth_token: str,
    profile: dict,
    conversation_history: list[dict],
    proctoring: dict | None = None,
) -> dict:
    """Evaluate the completed interview."""
    kwargs: dict = {
        "profile": profile,
        "conversationHistory": conversation_history,
    }
    if proctoring:
        kwargs["proctoring"] = proctoring
    return await _call_ai_interview("evaluate", auth_token, **kwargs)
