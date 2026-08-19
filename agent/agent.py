#!/usr/bin/env python3
"""
LiveKit Interview Agent — Entry Point

This agent joins a LiveKit room as a participant and conducts an AI interview.
It uses the LiveKit Agents framework with:
  - Deepgram Nova-2 for real-time speech-to-text
  - OpenAI TTS (nova voice) for text-to-speech
  - Next.js /api/ai-interview for LLM reasoning (adaptive difficulty, evaluation)

The agent does NOT call OpenAI directly for LLM responses — it routes through
the existing Next.js backend to keep all interview logic centralized.

Usage:
  # Development (auto-reconnects, verbose logging)
  python agent.py dev

  # Production
  python agent.py start

  # Deploy to LiveKit Cloud
  lk agent create
"""

import os
import json
import logging

from dotenv import load_dotenv

# Load environment variables before importing livekit modules
load_dotenv("../.env")

from livekit import agents
from livekit.agents import AgentServer, AgentSession, RoomOptions, AudioInputOptions
from livekit.plugins import openai, deepgram

from interview_agent import InterviewAgent

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
]
for var in required_vars:
    if not os.getenv(var):
        logger.warning("Environment variable %s is not set", var)

# Create the agent server
server = AgentServer()


@server.rtc_session(agent_name="interview-agent")
async def interview_entrypoint(ctx: agents.JobContext):
    """
    Entry point for interview agent sessions.

    When a client creates a LiveKit room and dispatches an agent,
    this function is called. It reads the room metadata to get
    the auth token and candidate profile, then starts the interview.
    """
    logger.info("Agent received job context, room: %s", ctx.room.name)

    # Extract configuration from room metadata
    metadata = {}
    try:
        if ctx.room.metadata:
            metadata = json.loads(ctx.room.metadata)
    except (json.JSONDecodeError, TypeError):
        logger.warning("Failed to parse room metadata, using defaults")

    auth_token = metadata.get("authToken", "")
    interview_id = metadata.get("interviewId", "")
    profile = metadata.get("profile", {
        "name": "Candidate",
        "currentRole": "Software Engineer",
        "totalExperience": "1-3 years",
        "skills": "Not specified",
    })

    if not auth_token:
        logger.error("No auth token in room metadata, cannot proceed")
        return

    logger.info(
        "Starting interview for candidate: %s (role: %s)",
        profile.get("name"),
        profile.get("currentRole"),
    )

    # Create the agent session with STT, TTS, and VAD
    # Note: We do NOT pass an LLM here because we route through Next.js
    session = AgentSession(
        stt=deepgram.STT(
            model="nova-2",
            language="en",
            interim_results=True,
            endpointing_ms=800,
            silence_duration_ms=600,
        ),
        tts=openai.TTS(
            model="tts-1",
            voice="nova",
            speed=1.0,
        ),
        # Use Silero VAD for voice activity detection
        # This handles turn detection and interruptions
    )

    # Create the interview agent
    agent = InterviewAgent(
        auth_token=auth_token,
        profile=profile,
        interview_id=interview_id,
    )

    # Start the agent session in the room
    await session.start(
        room=ctx.room,
        agent=agent,
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
