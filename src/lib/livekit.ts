import { RoomServiceClient, AccessToken, Room } from "livekit-server-sdk";
import { prisma } from "./prisma";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://livekit.techcitta.com";

let roomService: RoomServiceClient | null = null;

function getRoomService(): RoomServiceClient {
  if (!roomService) {
    roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  }
  return roomService;
}

/**
 * Generate a LiveKit access token for a participant.
 */
export async function generateLiveKitToken(
  roomName: string,
  identity: string,
  name: string,
  ttl: number = 60 * 60 * 4 // 4 hours
): Promise<string> {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name,
    ttl,
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });

  return await at.toJwt();
}

/**
 * Create a LiveKit room for an interview session.
 */
export async function createInterviewRoom(
  interviewId: string,
  userId: string
): Promise<{ roomName: string; token: string }> {
  const roomName = `interview-${interviewId}`;
  const identity = `candidate-${userId}`;
  const name = "Candidate";

  const svc = getRoomService();

  try {
    // Try to list existing rooms with this name
    const rooms = await svc.listRooms([roomName]);
    if (rooms.length === 0) {
      await svc.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 min timeout when empty
        maxParticipants: 2, // candidate + AI interviewer
        metadata: JSON.stringify({
          interviewId,
          userId,
          createdAt: new Date().toISOString(),
        }),
      });
    }
  } catch (error) {
    console.error("Failed to create LiveKit room:", error);
    // Fall back: token-only mode without room management
  }

  const token = await generateLiveKitToken(roomName, identity, name);

  // Store room info in the interview record
  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      livekitRoomName: roomName,
      livekitToken: token,
    },
  });

  return { roomName, token };
}

/**
 * Generate a fresh token for rejoining a room.
 */
export async function generateRejoinToken(
  roomName: string,
  userId: string,
  name: string
): Promise<string> {
  const identity = `candidate-${userId}`;
  return await generateLiveKitToken(roomName, identity, name);
}

/**
 * Get room information and participant list.
 */
export async function getRoomInfo(
  roomName: string
): Promise<{ room: Room | null; participantCount: number }> {
  try {
    const svc = getRoomService();
    const rooms = await svc.listRooms([roomName]);
    if (rooms.length === 0) return { room: null, participantCount: 0 };

    const participants = await svc.listParticipants(roomName);
    return {
      room: rooms[0],
      participantCount: participants.length,
    };
  } catch (error) {
    console.error("Failed to get room info:", error);
    return { room: null, participantCount: 0 };
  }
}

/**
 * End/close a LiveKit room.
 */
export async function endInterviewRoom(roomName: string): Promise<void> {
  try {
    const svc = getRoomService();
    await svc.deleteRoom(roomName);
  } catch (error) {
    console.error("Failed to delete LiveKit room:", error);
  }
}

/**
 * Check if LiveKit is configured.
 */
export function isLiveKitEnabled(): boolean {
  return Boolean(LIVEKIT_API_KEY && LIVEKIT_API_SECRET);
}
