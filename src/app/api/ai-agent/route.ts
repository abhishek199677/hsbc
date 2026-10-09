import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/authorization";
import { getTokenFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLiveKitUrl, isLiveAvatarConfigured } from "@/lib/livekit-config";
import {
  createInterviewRoom,
  isLiveKitEnabled,
} from "@/lib/livekit";

/**
 * POST /api/ai-agent - Dispatch the LiveKit AI agent to an interview room.
 *
 * This endpoint:
 * 1. Creates (or reuses) a LiveKit room for the interview
 * 2. Puts the candidate profile + an auth token in the room metadata, which is
 *    what agent/agent.py reads to call /api/ai-interview
 * 3. Issues an explicit dispatch for the "interview-agent" worker, so LiveKit
 *    actually starts a job for it (otherwise the candidate waits forever)
 * 4. Generates an access token for the candidate
 * 5. Returns connection details for the frontend
 */
export async function POST(request: Request) {
  try {
    const user = await getActiveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isLiveKitEnabled()) {
      return NextResponse.json(
        { error: "LiveKit is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { interviewId } = body;

    if (!interviewId || typeof interviewId !== "string") {
      return NextResponse.json(
        { error: "interviewId is required" },
        { status: 400 }
      );
    }

    // Verify the interview belongs to this user
    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      select: { id: true, status: true },
    });
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Get the candidate profile for the agent
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        currentRole: true,
        totalExperience: true,
        skills: true,
      },
    });

    const agentProfile = {
      name: user.name || "Candidate",
      currentRole: profile?.currentRole || "Software Engineer",
      totalExperience: profile?.totalExperience || "1-3 years",
      skills: profile?.skills || "Not specified",
    };

    // The agent needs a token for /api/ai-interview: reuse this request's
    // session (it is the candidate's own credential, so nothing new is granted).
    const authToken = getTokenFromRequest(request);

    // Create the LiveKit room, hand the agent its metadata, and dispatch it
    let roomName: string;
    let token: string;
    try {
      ({ roomName, token } = await createInterviewRoom(interviewId, user.id, {
        authToken: authToken ?? undefined,
        profile: agentProfile,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start the AI interviewer";
      return NextResponse.json({ error: message }, { status: 503 });
    }

    // Update the interview record with agent metadata
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        livekitRoomName: roomName,
        status: "in_progress",
      },
    });

    const livekitUrl = getLiveKitUrl();

    return NextResponse.json({
      success: true,
      roomName,
      token,
      url: livekitUrl,
      profile: agentProfile,
      interviewId,
    });
  } catch (error) {
    console.error("AI Agent dispatch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-agent - Check if LiveKit agent is available.
 * Used by the frontend to decide whether to use LiveKit or fallback to browser Speech API.
 */
export async function GET() {
  if (!isLiveKitEnabled()) {
    return NextResponse.json({
      available: false,
      error: "Live voice interviews are not configured. Set the LiveKit credentials.",
    });
  }
  if (!isLiveAvatarConfigured()) {
    return NextResponse.json({
      available: false,
      error:
        "Live interviewer video is not configured. Set SIMLI_API_KEY and SIMLI_FACE_ID to enable the realistic AI avatar.",
    });
  }
  return NextResponse.json({ available: true });
}
