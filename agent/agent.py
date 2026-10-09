#!/usr/bin/env python3
"""
LiveKit Interview Agent — Entry Point

This agent joins a LiveKit room as a participant and conducts the live
voice interview with the candidate:
  - Deepgram Nova-2 for real-time speech-to-text
  - Silero VAD for turn detection / barge-in (falls back to Deepgram endpointing)
  - OpenAI TTS (nova voice) for the interviewer's voice
  - Next.js /api/ai-interview for all interview logic (adaptive difficulty,
    prompt-injection guard, evaluation) via the InterviewLLM adapter

The agent is registered with the name "interview-agent"; the Next.js app
creates a room and issues an explicit dispatch for that name, passing the
candidate profile and an auth token in the room metadata.

Usage:
  # Development (auto-reconnects, verbose logging)
  ../.venv-agent/bin/python agent.py dev

  # Production
  ../.venv-agent/bin/python agent.py start
"""

import json
import logging
import os

from dotenv import load_dotenv

# Load environment variables before importing livekit modules
load_dotenv("../.env")

from livekit import agents
from livekit.agents import AgentServer, AgentSession
from livekit.agents.voice.room_io import AudioInputOptions, RoomOptions
from livekit.plugins import deepgram, openai, silero, simli

from interview_agent import InterviewAgent, InterviewBackend, InterviewLLM

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("agent")

# Ensure required environment variables are set
required_vars = [
    "LIVEKIT_URL",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET",
    "DEEPGRAM_API_KEY",
    "OPENAI_API_KEY",
    "SIMLI_API_KEY",
    "SIMLI_FACE_ID",
]
for var in required_vars:
    if not os.getenv(var):
        logger.warning("Environment variable %s is not set", var)

DEFAULT_PROFILE = {
    "name": "Candidate",
    "currentRole": "Software Engineer",
    "totalExperience": "1-3 years",
    "skills": "Not specified",
}

# How the interviewer sounds. Deliberately split from the script (which lives in
# /api/ai-interview): this only shapes delivery, so the model never invents
# content. Written as performance direction rather than adjectives so the
# speech doesn't come out like a newsreader.
VOICE_STYLE = (
    "You are a friendly human colleague conducting a relaxed one-on-one video "
    "interview, not a broadcast announcer. Speak warmly and conversationally, "
    "at a comfortable unhurried pace, with the small natural pauses a person "
    "uses while thinking. Use a natural Indian English accent. Let genuine "
    "warmth and mild curiosity come through — as if you are actually "
    "interested in the answer. Never sound monotone, robotic, over-rehearsed, "
    "or like you are reading a list of questions."
)

# Create the agent server
server = AgentServer()


def load_vad():
    """Silero gives reliable turn detection; degrade gracefully without it."""
    try:
        return silero.VAD.load()
    except Exception as exc:  # pragma: no cover - depends on local model cache
        logger.warning("Silero VAD unavailable (%s), relying on STT endpointing", exc)
        return None


@server.rtc_session(agent_name="interview-agent")
async def interview_entrypoint(ctx: agents.JobContext):
    """
    Entry point for interview agent sessions.

    Called when Next.js creates the room and dispatches "interview-agent".
    Reads the candidate profile + auth token from the room metadata, then
    runs the interview until the API reports it complete.
    """
    logger.info("Agent received job context, room: %s", ctx.room.name)

    # The Room object is still empty until the worker joins — metadata is only
    # populated after connect(), so read it AFTER the await below.
    await ctx.connect()

    # Extract configuration from room metadata (set by createInterviewRoom)
    metadata = {}
    try:
        if ctx.room.metadata:
            metadata = json.loads(ctx.room.metadata)
    except (json.JSONDecodeError, TypeError):
        logger.warning("Failed to parse room metadata, using defaults")

    auth_token = metadata.get("authToken", "")
    interview_id = metadata.get("interviewId", "")
    profile = metadata.get("profile") or DEFAULT_PROFILE

    if not auth_token:
        logger.error(
            "No authToken in room metadata — the frontend must create the room "
            "through POST /api/ai-agent. Cannot run an interview without it."
        )
        ctx.shutdown("missing room metadata (authToken)")
        return

    logger.info(
        "Starting interview for candidate: %s (role: %s)",
        profile.get("name"),
        profile.get("currentRole"),
    )

    backend = InterviewBackend(
        auth_token=auth_token,
        profile=profile,
        interview_id=interview_id or None,
    )

    session = AgentSession(
        stt=deepgram.STT(
            model="nova-2",
            language="en-US",
            interim_results=True,
            punctuate=True,
            endpointing_ms=800,
        ),
        vad=load_vad(),
        llm=InterviewLLM(backend),
        tts=openai.TTS(
            model="gpt-4o-mini-tts",
            voice="nova",
            speed=1.04,
            # Delivery direction, not content: the script comes from
            # /api/ai-interview, this only decides how it sounds. tts-1 has no
            # instructions field, hence gpt-4o-mini-tts.
            instructions=VOICE_STYLE,
        ),
    )

    agent = InterviewAgent(backend)
    agent.bind(session, ctx)

    async def end_interview() -> None:
        """Hang up for everyone so the frontend can show the results screen."""
        logger.info("Deleting interview room %s", ctx.room.name)
        await ctx.delete_room()

    backend.attach(session, end_interview)

    # Simli publishes synchronized, photorealistic video and audio as a
    # separate LiveKit participant. Wait for its video before starting speech.
    avatar = simli.AvatarSession(
        simli_config=simli.SimliConfig(
            api_key=os.environ["SIMLI_API_KEY"],
            face_id=os.environ["SIMLI_FACE_ID"],
            max_session_length=20 * 60,
            max_idle_time=120,
        )
    )
    await avatar.start(session, room=ctx.room)
    await avatar.wait_for_join()

    # Start the agent session in the room
    await session.start(
        agent=agent,
        room=ctx.room,
        room_options=RoomOptions(
            audio_input=AudioInputOptions(
                sample_rate=16000,
            ),
        ),
    )

    logger.info("Agent session started successfully")


if __name__ == "__main__":
    logger.info("Starting LiveKit Interview Agent...")
    agents.cli.run_app(server)
