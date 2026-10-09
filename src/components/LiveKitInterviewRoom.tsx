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

  // Check if AI agent is connected (non-local participant)
  const aiParticipant = participants.find(
    (p) => p.identity !== localParticipant?.identity
  );
  const isAiConnected = !!aiParticipant;
  const isAiSpeaking = aiParticipant?.isSpeaking ?? false;

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
      setAgentMissing(false);
      return;
    }
    // Only arm the timer while we are still waiting — clearing agentMissing
    // (i.e. retrying) restarts it, so a failed retry times out again too.
    if (agentMissing) return;
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - startedAt >= AGENT_JOIN_TIMEOUT_MS) {
        setAgentMissing(true);
      }
    }, 1000);
    return () => window.clearInterval(id);
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

      {/* Video panels */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Candidate video */}
        <div className="w-1/2 bg-[#18181b] rounded-xl overflow-hidden relative border border-[#27272a]" style={{ aspectRatio: "16/9" }}>
          {videoEnabled && localVideoTrack ? (
            <VideoTrack
              trackRef={localVideoTrack}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 bg-[#27272a] rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-[#a1a1aa]">Y</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-[#fafafa]">You</div>
        </div>

        {/* AI interviewer panel */}
        <div className="w-1/2 bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] rounded-xl overflow-hidden relative" style={{ aspectRatio: "16/9" }}>
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-5xl">🤖</span>
              </div>
              <p className="text-white font-medium">AI Interviewer</p>
              <p className="text-white/70 text-sm">
                {isAiConnected ? "Connected" : agentMissing ? "Unavailable" : "Connecting..."}
              </p>
            </div>
          </div>
          {isAiSpeaking && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 animate-pulse" />
              Speaking...
            </div>
          )}
          {!isAiConnected && !agentMissing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex items-center gap-2 text-white/80">
                <Loader className="w-4 h-4 animate-spin" />
                Waiting for AI agent...
              </div>
            </div>
          )}
          {!isAiConnected && agentMissing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-[#f59e0b] mb-2" />
              <p className="text-white font-medium mb-1">The AI interviewer hasn't joined yet</p>
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
