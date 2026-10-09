import { AccessToken, AgentDispatchClient, Room, RoomServiceClient } from "livekit-server-sdk";
import { prisma } from "./prisma";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://livekit.hireright.com";

/** Must match the name the Python agent registers with (agent/agent.py). */
export const INTERVIEW_AGENT_NAME = "interview-agent";

let roomService: RoomServiceClient | null = null;
let dispatchClient: AgentDispatchClient | null = null;

function getRoomService(): RoomServiceClient {
  if (!roomService) {
    roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  }
  return roomService;
}

function getDispatchClient(): AgentDispatchClient {
  if (!dispatchClient) {
    dispatchClient = new AgentDispatchClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  }
  return dispatchClient;
}

/** True when someone other than the candidate is already in the room (the agent). */
async function hasAgentParticipant(
  svc: RoomServiceClient,
  roomName: string,
  candidateIdentity: string
): Promise<boolean> {
  try {
    const participants = await svc.listParticipants(roomName);
    return participants.some((p) => p.identity !== candidateIdentity);
  } catch {
    return false;
  }
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
 * Create a LiveKit room for an interview session and dispatch the AI agent.
 *
 * `extraMetadata` carries what the agent needs to run the interview:
 * an auth token for /api/ai-interview and the candidate profile. It is read by
 * agent/agent.py from `ctx.room.metadata`.
 */
export async function createInterviewRoom(
  interviewId: string,
  userId: string,
  extraMetadata: { authToken?: string; profile?: Record<string, unknown> } = {}
): Promise<{ roomName: string; token: string }> {
  const roomName = `interview-${interviewId}`;
  const identity = `candidate-${userId}`;
  const name = "Candidate";

  const svc = getRoomService();

  const metadata = JSON.stringify({
    interviewId,
    userId,
    createdAt: new Date().toISOString(),
    authToken: extraMetadata.authToken ?? null,
    profile: extraMetadata.profile ?? null,
  });

  try {
    // Try to list existing rooms with this name
    const rooms = await svc.listRooms([roomName]);
    if (rooms.length === 0) {
      await svc.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 min timeout when empty
        maxParticipants: 2, // candidate + AI interviewer
        metadata,
      });
    } else {
      // Rooms created by older code have no authToken/profile — refresh so the
      // agent that gets dispatched below can actually run the interview.
      await svc.updateRoomMetadata(roomName, metadata);
    }
  } catch (error) {
    console.error("Failed to create LiveKit room:", error);
    // Fall back: token-only mode without room management
  }

  // Explicit dispatch: the agent registers as "interview-agent", so LiveKit
  // only starts a job for it when we ask for one by name. Without this the
  // candidate waits forever on "Waiting for AI agent...".
  try {
    const alreadyServed = await hasAgentParticipant(svc, roomName, identity);
    const existing = (await getDispatchClient().listDispatch(roomName)).filter(
      (d) => d.agentName === INTERVIEW_AGENT_NAME
    );
    // A dispatch is only useful if its job is recent (the agent joins within a
    // couple of seconds). One left behind by a crashed agent must not block a
    // retry, otherwise "Try again" would do nothing forever.
    const nowMs = Date.now();
    const jobRecent = existing.some((d) => {
      if ((d.state?.jobs?.length ?? 0) === 0) return false;
      const raw = Number(d.state?.createdAt ?? 0);
      if (!raw) return true;
      const createdAtMs = raw < 1e12 ? raw * 1000 : raw;
      return nowMs - createdAtMs < 60_000;
    });

    if (!alreadyServed && !jobRecent) {
      // Clear leftovers from a failed attempt before asking for a new job.
      for (const stale of existing) {
        await getDispatchClient().deleteDispatch(stale.id, roomName).catch(() => undefined);
      }
      await getDispatchClient().createDispatch(roomName, INTERVIEW_AGENT_NAME);
      console.log("[livekit] dispatched %s to %s", INTERVIEW_AGENT_NAME, roomName);
    }
  } catch (error) {
    console.error("Failed to dispatch the interview agent:", error);
    throw new Error(
      "The AI interviewer is not available right now — please start the agent service (./dev-all.sh) and try again."
    );
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
