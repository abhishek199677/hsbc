import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import {
  createInterviewRoom,
  generateRejoinToken,
  getRoomInfo,
  endInterviewRoom,
  isLiveKitEnabled,
} from "@/lib/livekit";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/livekit - Create or join a LiveKit room
 */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
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
    const { action, interviewId } = body;

    if (action === "create") {
      if (!interviewId) {
        return NextResponse.json(
          { error: "Interview ID required" },
          { status: 400 }
        );
      }

      const interview = await prisma.interview.findFirst({
        where: { id: interviewId, userId: user.userId },
        select: { id: true },
      });
      if (!interview) {
        return NextResponse.json({ error: "Interview not found" }, { status: 404 });
      }

      const { roomName, token } = await createInterviewRoom(
        interviewId,
        user.userId
      );

      return NextResponse.json({
        success: true,
        roomName,
        token,
        url: `${process.env.LIVEKIT_URL || "wss://livekit.hireright.com"}?token=${token}`,
      });
    }

    if (action === "rejoin") {
      const interview = await prisma.interview.findUnique({
        where: { userId: user.userId },
        select: { livekitRoomName: true },
      });

      if (!interview?.livekitRoomName) {
        return NextResponse.json(
          { error: "No active room found" },
          { status: 404 }
        );
      }

      const token = await generateRejoinToken(
        interview.livekitRoomName,
        user.userId,
        "Candidate" // Name will be displayed in LiveKit
      );

      return NextResponse.json({
        success: true,
        roomName: interview.livekitRoomName,
        token,
      });
    }

    if (action === "info") {
      const interview = await prisma.interview.findUnique({
        where: { userId: user.userId },
        select: { livekitRoomName: true },
      });

      if (!interview?.livekitRoomName) {
        return NextResponse.json(
          { error: "No active room found" },
          { status: 404 }
        );
      }

      const { room, participantCount } = await getRoomInfo(
        interview.livekitRoomName
      );

      return NextResponse.json({
        success: true,
        room: room
          ? {
              name: room.name,
              numParticipants: participantCount,
              emptyTimeout: room.emptyTimeout,
              metadata: room.metadata,
            }
          : null,
      });
    }

    if (action === "end") {
      const interview = await prisma.interview.findUnique({
        where: { userId: user.userId },
        select: { livekitRoomName: true },
      });

      if (interview?.livekitRoomName) {
        await endInterviewRoom(interview.livekitRoomName);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("LiveKit API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
