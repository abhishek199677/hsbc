"use client";

/**
 * LiveKitInterviewRoom — Wraps the LiveKit Room UI for the interview.
 *
 * This component connects to a LiveKit room using the provided token,
 * renders the candidate's video and the AI agent's audio, and provides
 * controls for the interview.
 *
 * It uses @livekit/components-react for the room UI and handles
 * connection state, errors, and disconnect events.
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useTranscriptions,
  useVoiceAssistant,
  ConnectionStateToast,
  VideoTrack,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Video, VideoOff, Mic, MicOff, Phone, Loader,
  Volume2, AlertTriangle, Wifi, Captions,
} from "lucide-react";

interface Props {
  /** LiveKit server WebSocket URL (e.g., wss://...) */
  serverUrl: string;
  /** Access token for the candidate to join the room */
  token: string;
  /** Callback when the interview ends or the room disconnects */
  onDisconnected?: () => void;
  /**
   * Called when the AI agent has not joined within the grace period — the
   * caller re-dispatches the agent without dropping the candidate's call.
   */
  onRetry?: () => void;
  /** Whether the user's camera is enabled */
  videoEnabled?: boolean;
  /** Whether the user's microphone is enabled */
  audioEnabled?: boolean;
}

/** How long the candidate waits for the agent before showing recovery options.
 *  The API already refuses to hand over a room until the agent is in it, so
 *  this only covers an agent that joins and then drops — keep it short. */
const AGENT_JOIN_TIMEOUT_MS = 12_000;

/**
 * Inner component that renders the interview layout.
 * Must be inside a LiveKitRoom provider.
 */
function InterviewLayout({
  onEndCall,
  onRetry,
  videoEnabled,
  audioEnabled,
  onToggleVideo,
  onToggleAudio,
}: {
  onEndCall: () => void;
  onRetry?: () => void;
  videoEnabled: boolean;
  audioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { agent, state: agentState, videoTrack: avatarVideoTrack } = useVoiceAssistant();
  const tracks = useTracks();
  // The agent publishes its TTS text into the room as it speaks, so the
  // question is readable even when the candidate can't hear (muted speakers,
  // blocked autoplay, hearing impairment, noisy room).
  const transcriptions = useTranscriptions();

  // Find the local participant's video track
  const localVideoTrack = tracks.find(
    (t) =>
      t.participant.identity === localParticipant?.identity &&
      t.source === Track.Source.Camera
  );

  const isAiConnected = !!agent;
  const isAiSpeaking = agentState === "speaking";

  // Live captions. Transcriptions are keyed by segment id, so partial
  // updates replace themselves rather than appending — merge consecutive
  // entries per speaker and keep the last few turns on screen.
  const transcript = useMemo(() => {
    const localId = localParticipant?.identity;
    const agentIds = new Set(
      participants.filter((p) => p.identity !== localId).map((p) => p.identity)
    );
    const lines: { from: "ai" | "you"; text: string }[] = [];
    for (const segment of transcriptions) {
      const text = segment.text.trim();
      if (!text) continue;
      const from = agentIds.has(segment.participantInfo.identity) ? "ai" : "you";
      const last = lines[lines.length - 1];
      if (last && last.from === from) {
        last.text = text; // interim update for the same segment
      } else {
        lines.push({ from, text });
      }
    }
    return lines.slice(-6);
  }, [transcriptions, participants, localParticipant?.identity]);

  // Don't spin forever: if the agent hasn't joined in time, offer a way out.
  const [agentMissing, setAgentMissing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (isAiConnected) {
      if (agentMissing) {
        const resetId = window.setTimeout(() => setAgentMissing(false), 0);
        return () => window.clearTimeout(resetId);
      }
      return;
    }
    if (agentMissing) return;
    const timeoutId = window.setTimeout(
      () => setAgentMissing(true),
      AGENT_JOIN_TIMEOUT_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, [isAiConnected, agentMissing]);

  const handleRetry = async () => {
    if (retrying || !onRetry) return;
    setRetrying(true);
    setAgentMissing(false); // back to "Connecting…" while we re-dispatch
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Connection status banner */}
      {!isAiConnected && !agentMissing && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center justify-center gap-2 text-yellow-300 text-sm">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Connecting to AI interviewer...</span>
        </div>
      )}
      {!isAiConnected && agentMissing && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 flex items-center justify-center gap-2 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>AI interviewer unavailable — try again below</span>
        </div>
      )}
      {isAiConnected && (
        <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/30 flex items-center justify-center gap-2 text-green-300 text-sm">
          <Wifi className="w-4 h-4" />
          <span>Connected</span>
        </div>
      )}

      {/* Stage: one person opposite another, not a grid of equal tiles. The
          interviewer gets the frame; the candidate sees themselves in a small
          self-view, exactly like a real one-on-one video call.

          The max-width is derived from the viewport height so a 16:9 stage
          always leaves room for the transcript and controls. */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 px-4 py-4 mx-auto w-full max-w-[max(380px,min(1400px,calc((100vh_-_300px)*16/9)))]">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#27272a] bg-[#18181b]">
          {avatarVideoTrack ? (
            <VideoTrack
              trackRef={avatarVideoTrack}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#18181b] text-[#a1a1aa]">
              <Loader className="h-6 w-6 animate-spin" />
              <span className="text-sm">
                {isAiConnected ? "Connecting interviewer video..." : "Waiting for the interviewer..."}
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/55 backdrop-blur-sm rounded-full text-xs text-white/90">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
            AI Interviewer
          </div>

          {isAiSpeaking && (
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/55 rounded text-xs text-white flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 animate-pulse" />
              Speaking...
            </div>
          )}

          {!isAiConnected && !agentMissing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <div className="flex items-center gap-2 text-white/80">
                <Loader className="w-4 h-4 animate-spin" />
                Waiting for AI agent...
              </div>
            </div>
          )}

          {!isAiConnected && agentMissing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-[#f59e0b] mb-2" />
              <p className="text-white font-medium mb-1">The AI interviewer has not joined yet</p>
              <p className="text-white/70 text-sm mb-4">
                The interview agent may not be running. Try again — your camera and mic stay on.
              </p>
              <div className="flex gap-3">
                {onRetry && (
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="px-4 py-2 bg-[#a78bfa] text-white rounded-lg hover:bg-[#8b5cf6] text-sm disabled:opacity-60"
                  >
                    {retrying ? "Retrying…" : "Try again"}
                  </button>
                )}
                <button
                  onClick={onEndCall}
                  className="px-4 py-2 bg-[#27272a] text-white rounded-lg hover:bg-[#3f3f46] text-sm"
                >
                  End call
                </button>
              </div>
            </div>
          )}

          {/* Candidate self-view */}
          <div className="absolute bottom-3 right-3 w-[32%] max-w-[240px] min-w-[112px] aspect-[4/3] rounded-lg overflow-hidden border border-white/15 bg-[#18181b] shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            {videoEnabled && localVideoTrack ? (
              <VideoTrack
                trackRef={localVideoTrack}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-9 h-9 bg-[#27272a] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-[#a1a1aa]">Y</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-1 left-1.5 text-[10px] text-white/85 drop-shadow">You</div>
          </div>
        </div>

      {/* Live captions — the AI's words on screen, so a question is never
          lost to muted speakers, blocked autoplay or a noisy room. */}
      {transcript.length > 0 && (
        <div className="mx-4 mb-2 rounded-lg border border-[#27272a] bg-[#101012] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[#71717a]">
            <Captions className="h-3.5 w-3.5" />
            Live transcript
          </div>
          <div className="space-y-1.5">
            {transcript.map((line, index) => (
              <p
                key={`${line.from}-${index}`}
                className={`text-sm leading-relaxed ${
                  line.from === "ai" ? "text-[#fafafa]" : "text-[#a1a1aa]"
                }`}
              >
                <span
                  className={`mr-1.5 font-semibold ${
                    line.from === "ai" ? "text-[#a78bfa]" : "text-[#71717a]"
                  }`}
                >
                  {line.from === "ai" ? "AI" : "You"}:
                </span>
                {line.text}
              </p>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Audio renderer — plays the AI agent's audio track */}
      <RoomAudioRenderer />

      {/* Controls */}
      <div className="flex justify-center gap-4 py-4 bg-[#18181b] border-t border-[#27272a]">
        <button
          onClick={onToggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
            videoEnabled ? "bg-[#27272a] text-[#fafafa] hover:bg-[#3f3f46]" : "bg-[#ef4444] text-white hover:bg-[#dc2626]"
          }`}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          onClick={onToggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
            audioEnabled ? "bg-[#27272a] text-[#fafafa] hover:bg-[#3f3f46]" : "bg-[#ef4444] text-white hover:bg-[#dc2626]"
          }`}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={onEndCall}
          className="w-12 h-12 rounded-full bg-[#ef4444] text-white flex items-center justify-center hover:bg-[#dc2626] transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Phone className="w-5 h-5 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}

/**
 * Main exported component: wraps everything in a LiveKitRoom provider.
 */
export default function LiveKitInterviewRoom({
  serverUrl,
  token,
  onDisconnected,
  onRetry,
  videoEnabled: initialVideo = true,
  audioEnabled: initialAudio = true,
}: Props) {
  const [videoEnabled, setVideoEnabled] = useState(initialVideo);
  const [audioEnabled, setAudioEnabled] = useState(initialAudio);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleToggleVideo = useCallback(() => {
    setVideoEnabled((prev) => !prev);
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => !prev);
  }, []);

  const handleDisconnect = useCallback(() => {
    onDisconnected?.();
  }, [onDisconnected]);

  const handleConnected = useCallback(() => {
    setConnectionError(null);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("LiveKit room error:", error);
    setConnectionError(error.message || "Connection failed");
  }, []);

  if (connectionError) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="bg-[#18181b] rounded-xl p-8 max-w-md w-full text-center border border-[#27272a]">
          <AlertTriangle className="w-12 h-2xl text-[#f59e0b] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Connection Error</h2>
          <p className="text-[#a1a1aa] mb-4">{connectionError}</p>
          <button
            onClick={onDisconnected}
            className="px-4 py-2 bg-[#a78bfa] text-white rounded-lg hover:bg-[#8b5cf6]"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        video={videoEnabled}
        audio={audioEnabled}
        onConnected={handleConnected}
        onDisconnected={handleDisconnect}
        onError={handleError}
        style={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        <ConnectionStateToast />
        <InterviewLayout
          onEndCall={handleDisconnect}
          onRetry={onRetry}
          videoEnabled={videoEnabled}
          audioEnabled={audioEnabled}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
        />
      </LiveKitRoom>
    </div>
  );
}
