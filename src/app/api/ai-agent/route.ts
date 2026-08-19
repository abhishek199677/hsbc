import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  createInterviewRoom,
  isLiveKitEnabled,
} from "@/lib/livekit";

/**
 * POST /api/ai-agent - Dispatch the LiveKit AI agent to an interview room.
 *
 * This endpoint:
 * 1. Creates (or reuses) a LiveKit room for the interview
 * 2. Generates an access token for the candidate
 * 3. Stores the interview metadata needed by the agent
 * 4. Returns connection details for the frontend
 *
 * The Python agent (agent/agent.py) is dispatched separately via LiveKit Cloud
 * and reads the room metadata to authenticate and start the interview.
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

    // Create the LiveKit room and generate a candidate token
    const { roomName, token } = await createInterviewRoom(interviewId, user.id);

    // Update the interview record with agent metadata
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        livekitRoomName: roomName,
        status: "in_progress",
      },
    });

    // The room metadata is already set by createInterviewRoom.
    // We also store the auth token in the room metadata so the agent
    // can authenticate with the Next.js API.
    // Note: In production, use a more secure approach (e.g., short-lived tokens).
    const livekitUrl = process.env.LIVEKIT_URL || "wss://techcitta-b5zx3t8p.livekit.cloud";

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
    return NextResponse.json({ available: false });
  }
  return NextResponse.json({ available: true });
}
