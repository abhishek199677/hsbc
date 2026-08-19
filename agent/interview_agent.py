"""
Interview Agent — a LiveKit Agents Agent that conducts AI interviews.

Flow:
1. Agent joins a LiveKit room as a participant.
2. Subscribes to the candidate's audio track.
3. Streams audio to Deepgram for real-time STT.
4. Sends transcribed text to Next.js /api/ai-interview for LLM response.
5. Converts AI response to audio via OpenAI TTS and publishes back to the room.
6. Repeats until the interview is complete (10 questions, 70/30 split).

The agent does NOT call OpenAI directly for LLM reasoning — it routes through
the existing Next.js API to reuse adaptive difficulty, prompt injection defense,
and evaluation logic.
"""

import json
import logging
from typing import Optional

from livekit.agents import Agent, AgentSession

from nextjs_client import start_interview, respond_to_candidate, evaluate_interview

logger = logging.getLogger("agent.interview")


class InterviewAgent(Agent):
    """
    A LiveKit Agent that conducts a structured AI interview.

    Interview structure (adaptive 70/30):
    - Questions 1-2: Warm-up (easy behavioral)
    - Questions 3-5: Core skills (70% skill-based, adaptive difficulty)
    - Questions 6-7: Coding challenges (30% coding)
    - Questions 8-9: Skill follow-up based on coding
    - Question 10: Wrap-up

    The agent tracks performance scores and adjusts difficulty dynamically.
    """

    def __init__(
        self,
        auth_token: str,
        profile: dict,
        interview_id: str | None = None,
    ):
        super().__init__(
            instructions=(
                "You are an AI interviewer for HireRight, a job screening platform. "
                "You are conducting a 15-minute professional interview with a 70/30 split: "
                "70% skill-based questions, 30% coding challenges. "
                "Be professional, friendly, and concise. "
                "Ask one question at a time. "
                "Keep responses short (2-3 sentences max). "
                "Speak in simple, warm everyday English. Keep it friendly and natural. "
                "Adapt difficulty based on how the candidate performs. "
                "Adapt questions to their experience level: "
                "FRESHERS get fundamentals and learning-focused questions; "
                "MID-LEVEL (3-5 years) get practical project and ownership questions; "
                "SENIORS (5+ years) get system design, leadership, and architecture questions."
            )
        )
        self.auth_token = auth_token
        self.profile = profile
        self.interview_id = interview_id
        self.conversation_history: list[dict] = []
        self.question_count = 0
        self.max_questions = 10

        # Adaptive state
        self.difficulty = "easy"
        self.phase = "warmup"
        self.coding_count = 0
        self.skill_count = 0
        self.performance_scores: list[int] = []
        self.last_was_coding = False

    async def on_start(self, session: AgentSession) -> None:
        """Called when the agent is started and connected to the room."""
        logger.info(
            "Interview agent starting for candidate: %s",
            self.profile.get("name", "Unknown"),
        )

        # Call the Next.js API to generate the intro and first question
        result = await start_interview(self.auth_token, self.profile)

        if result.get("success"):
            ai_message = result.get("message", "")
            if ai_message:
                self.conversation_history.append({
                    "role": "assistant",
                    "content": ai_message,
                })
                self.question_count = 1
                self.difficulty = result.get("difficulty", "easy")
                self.phase = result.get("phase", "warmup")
                # Speak the first question via TTS
                await session.say(ai_message)
                logger.info("Agent spoke first question (%d chars)", len(ai_message))
        else:
            error_msg = (
                "I'm sorry, I'm having trouble connecting to the interview system. "
                "Please try refreshing the page."
            )
            await session.say(error_msg)
            logger.error("Failed to start interview: %s", result.get("error"))

    async def on_user_speech(self, text: str, session: AgentSession) -> None:
        """
        Called when the candidate's speech has been transcribed by Deepgram.
        """
        if not text or not text.strip():
            logger.warning("Empty transcription received, skipping")
            return

        cleaned = text.strip()
        logger.info(
            "Candidate said (%d words): %.100s...",
            len(cleaned.split()),
            cleaned,
        )

        # Add user message to conversation history
        self.conversation_history.append({
            "role": "user",
            "content": cleaned,
        })

        # Get AI response from the Next.js backend with interview state
        result = await respond_to_candidate(
            self.auth_token,
            cleaned,
            self.conversation_history,
            interview_state={
                "messageCount": self.question_count,
                "difficulty": self.difficulty,
                "phase": self.phase,
                "codingCount": self.coding_count,
                "skillCount": self.skill_count,
                "performanceScores": self.performance_scores,
                "lastWasCoding": self.last_was_coding,
            },
        )

        if not result.get("success"):
            error_msg = (
                "I'm sorry, I didn't catch that. Could you please repeat your answer?"
            )
            await session.say(error_msg)
            logger.error("Failed to get AI response: %s", result.get("error"))
            return

        ai_message = result.get("message", "")
        is_complete = result.get("isComplete", False)
        trigger_coding = result.get("triggerCoding", False)

        if not ai_message:
            await session.say("I'm sorry, could you please repeat that?")
            return

        # Update adaptive state
        self.difficulty = result.get("difficulty", self.difficulty)
        self.phase = result.get("phase", self.phase)
        if result.get("codingCount") is not None:
            self.coding_count = result["codingCount"]
        if result.get("skillCount") is not None:
            self.skill_count = result["skillCount"]
        if result.get("performanceScores"):
            self.performance_scores = result["performanceScores"]
        self.last_was_coding = result.get("lastWasCoding", False)

        # Add AI response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": ai_message,
        })

        if trigger_coding:
            # The API wants to trigger a coding challenge
            await session.say(ai_message)
            # The coding challenge is handled by the frontend — the agent
            # continues listening for the candidate's next voice input after
            # the coding challenge is completed.
            logger.info("Coding challenge triggered at question %d", self.question_count)
            return

        if is_complete:
            # Interview is complete — speak the closing message
            await session.say(ai_message)
            logger.info(
                "Interview complete after %d exchanges",
                len(self.conversation_history) // 2,
            )
            # Evaluate the interview in the background
            await self._evaluate(session)
            # Disconnect the agent from the room
            await session.disconnect()
        else:
            self.question_count += 1
            await session.say(ai_message)
            logger.info(
                "Agent spoke question %d (phase: %s, difficulty: %s, %d chars)",
                self.question_count,
                self.phase,
                self.difficulty,
                len(ai_message),
            )

    async def on_interruption(self, session: AgentSession) -> None:
        """Called when the candidate interrupts the agent's speech."""
        logger.info("Candidate interrupted the agent")

    async def _evaluate(self, session: AgentSession) -> None:
        """Evaluate the interview after it completes."""
        logger.info("Starting interview evaluation...")
        result = await evaluate_interview(
            self.auth_token,
            self.profile,
            self.conversation_history,
        )
        if result.get("success"):
            logger.info("Interview evaluation completed successfully")
        else:
            logger.error("Interview evaluation failed: %s", result.get("error"))
