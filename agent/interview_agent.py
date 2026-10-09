"""
Interview Agent — a LiveKit Agents agent that conducts the live voice interview.

How the pieces fit together (livekit-agents 1.x):

  AgentSession(stt=Deepgram, vad=Silero, llm=InterviewLLM, tts=OpenAI)
      │
      ├─ STT transcribes the candidate, VAD detects turn boundaries
      ├─ on every completed user turn the session asks InterviewLLM for a reply
      │      InterviewLLM posts `action=respond` to Next.js /api/ai-interview
      │      (adaptive difficulty, injection guard and evaluation stay there)
      └─ the returned text is spoken with TTS and published to the room

The interview lifecycle (greeting, closing, ending the call) is driven by
InterviewAgent.on_enter / InterviewBackend, because the framework's lifecycle
hooks are on_enter/on_exit/on_user_turn_completed — NOT the on_start/
on_user_speech pair that livekit-agents <1.x used.
"""

from __future__ import annotations

import asyncio
import logging
import re

from livekit.agents import Agent, AgentSession, llm
from livekit.agents.llm import ChatChunk, ChoiceDelta, LLM, LLMStream
from livekit.agents.types import (
    APIConnectOptions,
    DEFAULT_API_CONNECT_OPTIONS,
    NotGivenOr,
)

from nextjs_client import (
    get_coding_challenge,
    respond_to_candidate,
    start_interview,
)

logger = logging.getLogger("agent.interview")

# /api/ai-interview appends adaptive-state markers to every reply. They are for
# the API client, never for the candidate's ears.
_MARKER_RE = re.compile(r"\s*\[(?:DIFFICULTY|PHASE):\s*[a-z]+\]\s*", re.IGNORECASE)

FALLBACK_REPLY = (
    "Sorry, I lost you for a second. Could you say that again?"
)
GREETING_FAILED = (
    "Hi! I'm having trouble reaching the interview system on my side. "
    "Please end the call and start the interview again."
)


def strip_markers(text: str) -> str:
    """Remove [DIFFICULTY: ...] / [PHASE: ...] so they are never spoken."""
    return _MARKER_RE.sub(" ", text).strip()


def _speakable_challenge(challenge: dict) -> str:
    """Turn a coding challenge payload into something that reads well aloud."""
    title = str(challenge.get("title") or "a coding question")
    description = re.sub(r"\s+", " ", str(challenge.get("description") or "")).strip()
    parts = ["Let's switch to a quick coding question. It's called", f"{title}."]
    if description:
        parts.append(description)
    parts.append(
        "Take a moment, then talk me through your approach and your solution out loud."
    )
    return " ".join(parts)


def _last_user_message(chat_ctx: llm.ChatContext) -> str | None:
    for item in reversed(chat_ctx.items):
        if isinstance(item, llm.ChatMessage) and item.role == "user":
            text = (item.text_content or "").strip()
            if text:
                return text
    return None


class InterviewBackend:
    """
    Single owner of the conversation state shared by the greeting (on_enter)
    and every subsequent turn (InterviewLLM).

    /api/ai-interview keeps the source of truth for history + adaptive state in
    the DB, so we only need to hand it the candidate's latest answer.
    """

    def __init__(
        self,
        auth_token: str,
        profile: dict,
        interview_id: str | None = None,
    ) -> None:
        self.auth_token = auth_token
        self.profile = profile
        self.interview_id = interview_id
        self.completed = False
        self._session: AgentSession | None = None
        self._end_interview = None  # callable set by the entrypoint
        self._lock = asyncio.Lock()

    def attach(self, session: AgentSession, end_interview) -> None:
        """Wire in the LiveKit session and the room-teardown callback."""
        self._session = session
        self._end_interview = end_interview

    async def greet(self) -> str:
        """Fetch the intro + first question from /api/ai-interview."""
        try:
            result = await start_interview(self.auth_token, self.profile)
        except Exception:
            logger.exception("start_interview raised")
            return GREETING_FAILED

        if not result.get("success"):
            logger.error("Failed to start interview: %s", result.get("error"))
            return GREETING_FAILED

        return strip_markers(result.get("message") or "") or GREETING_FAILED

    async def respond(self, user_text: str) -> str:
        """Get the interviewer's next line for the candidate's latest answer."""
        if self.completed:
            return FALLBACK_REPLY

        async with self._lock:
            try:
                result = await respond_to_candidate(self.auth_token, user_text, [])
            except Exception:
                logger.exception("respond_to_candidate raised")
                return FALLBACK_REPLY

        if not result.get("success"):
            logger.error("Failed to get AI response: %s", result.get("error"))
            return FALLBACK_REPLY

        message = strip_markers(result.get("message") or "")

        # The API only announces that a coding challenge is on screen — in a
        # voice call we read the actual problem aloud instead.
        if result.get("triggerCoding"):
            message = await self._coding_challenge_line(message)

        if result.get("isComplete"):
            self.completed = True
            logger.info("Interview complete — closing the room")
            self._schedule_close()

        return message or FALLBACK_REPLY

    async def _coding_challenge_line(self, fallback: str) -> str:
        try:
            result = await get_coding_challenge(self.auth_token)
        except Exception:
            logger.exception("coding_challenge raised")
            return fallback
        if not result.get("success") or not result.get("challenge"):
            return fallback
        return _speakable_challenge(result["challenge"])

    def _schedule_close(self) -> None:
        """After the closing line has been spoken, hang up for everyone."""
        if self._end_interview is None:
            return

        async def _close() -> None:
            try:
                session = self._session
                if session is not None:
                    try:
                        # Let the closing message finish playing first
                        await asyncio.wait_for(session.wait_for_idle(), timeout=45)
                    except (asyncio.TimeoutError, TimeoutError):
                        await asyncio.sleep(10)
                    except Exception:
                        await asyncio.sleep(10)
                await self._end_interview()
            except Exception:
                logger.exception("Failed to close the interview room")

        asyncio.create_task(_close())


class InterviewLLM(LLM):
    """
    Makes POST /api/ai-interview look like an LLM to the AgentSession.

    The session handles turn detection, interruption and TTS for us; we only
    supply the text. The API builds its own system prompt and keeps state, so
    the rest of the chat context is intentionally ignored.
    """

    def __init__(self, backend: InterviewBackend) -> None:
        super().__init__()
        self._backend = backend

    @property
    def model(self) -> str:
        return "hireright-ai-interview"

    @property
    def provider(self) -> str:
        return "hireright"

    def chat(
        self,
        *,
        chat_ctx: llm.ChatContext,
        tools: list[llm.Tool] | None = None,
        conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS,
        parallel_tool_calls: NotGivenOr[bool] = None,
        tool_choice: NotGivenOr[llm.ToolChoice] = None,
        extra_kwargs: NotGivenOr[dict] = None,
    ) -> LLMStream:
        return InterviewLLMStream(
            self,
            chat_ctx=chat_ctx,
            tools=tools or [],
            conn_options=conn_options,
            backend=self._backend,
        )


class InterviewLLMStream(LLMStream):
    def __init__(self, llm_client: InterviewLLM, *, chat_ctx, tools, conn_options, backend):
        super().__init__(
            llm_client,
            chat_ctx=chat_ctx,
            tools=tools,
            conn_options=conn_options,
        )
        self._backend = backend

    async def _run(self) -> None:
        user_message = _last_user_message(self._chat_ctx)
        if not user_message:
            logger.warning("No user message in chat context, skipping reply")
            return

        logger.info("Asking interview API for a reply (%d chars)", len(user_message))
        reply = await self._backend.respond(user_message)

        self._event_ch.send_nowait(
            ChatChunk(
                id="ai-interview",
                delta=ChoiceDelta(role="assistant", content=reply),
            )
        )
        logger.info("Interview reply ready (%d chars)", len(reply))


class InterviewAgent(Agent):
    """Greets the candidate when they join and follows the API's script."""

    def __init__(self, backend: InterviewBackend) -> None:
        super().__init__(
            instructions=(
                "You are the AI interviewer for HireRight. You conduct a 15-minute "
                "screening interview: one question at a time, short and friendly."
            )
        )
        self._backend = backend
        self._session: AgentSession | None = None
        self._ctx = None  # JobContext, set by the entrypoint

    def bind(self, session: AgentSession, ctx=None) -> None:
        self._session = session
        self._ctx = ctx

    async def on_enter(self) -> None:
        """Fired once the session starts — say hello and ask question 1."""
        # Run in the background so the STT pipeline starts listening immediately.
        asyncio.create_task(self._open_interview())

    async def _open_interview(self) -> None:
        session = self._session
        if session is None:
            logger.error("InterviewAgent has no session bound")
            return

        # The agent is usually dispatched before the candidate joins; wait a
        # little so the greeting isn't spoken into an empty room.
        ctx = self._ctx
        if ctx is not None:
            try:
                await asyncio.wait_for(ctx.wait_for_participant(), timeout=20)
            except (asyncio.TimeoutError, TimeoutError):
                logger.warning("Candidate did not join within 20s, greeting anyway")
            except Exception:
                logger.exception("wait_for_participant failed")

        try:
            greeting = await self._backend.greet()
        except Exception:
            logger.exception("greeting failed")
            greeting = GREETING_FAILED

        try:
            await session.say(greeting)
            logger.info("Agent greeted the candidate (%d chars)", len(greeting))
        except Exception:
            logger.exception("Failed to speak greeting")

    # on_user_turn_completed is left to the framework: it hands the turn to
    # InterviewLLM, whose stream asks /api/ai-interview for the next question.
