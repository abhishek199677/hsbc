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

import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useLocalParticipant,
  ConnectionStateToast,
  VideoTrack,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  Video, VideoOff, Mic, MicOff, Phone, Loader,
  Volume2, AlertTriangle, Wifi,
} from "lucide-react";

interface Props {
  /** LiveKit server WebSocket URL (e.g., wss://...) */
  serverUrl: string;
  /** Access token for the candidate to join the room */
  token: string;
  /** Callback when the interview ends or the room disconnects */
  onDisconnected?: () => void;
  /** Whether the user's camera is enabled */
  videoEnabled?: boolean;
  /** Whether the user's microphone is enabled */
  audioEnabled?: boolean;
}

/**
 * Inner component that renders the interview layout.
 * Must be inside a LiveKitRoom provider.
 */
function InterviewLayout({
  onEndCall,
  videoEnabled,
  audioEnabled,
  onToggleVideo,
  onToggleAudio,
}: {
  onEndCall: () => void;
  videoEnabled: boolean;
  audioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks();

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

  return (
    <div className="flex-1 flex flex-col">
      {/* Connection status banner */}
      {!isAiConnected && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center justify-center gap-2 text-yellow-300 text-sm">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Connecting to AI interviewer...</span>
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
                {isAiConnected ? "Connected" : "Connecting..."}
              </p>
            </div>
          </div>
          {isAiSpeaking && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 animate-pulse" />
              Speaking...
            </div>
          )}
          {!isAiConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex items-center gap-2 text-white/80">
                <Loader className="w-4 h-4 animate-spin" />
                Waiting for AI agent...
              </div>
            </div>
          )}
        </div>
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
          videoEnabled={videoEnabled}
          audioEnabled={audioEnabled}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
        />
      </LiveKitRoom>
    </div>
  );
}
