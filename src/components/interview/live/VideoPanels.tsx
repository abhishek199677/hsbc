import { VideoOff } from "lucide-react";
import type { VideoPanelsProps } from "./types";

export default function VideoPanels({
  videoEnabled,
  liveVideoAvailable,
  user,
  videoRef,
  interviewStarted,
  interviewEnded,
  showCaptions,
  isListening,
  liveTranscript,
  isAiSpeaking,
  lastAiMessage,
  currentDifficulty,
  questionNumber,
}: VideoPanelsProps) {
  return (
    <div className="w-1/3 p-4 flex flex-col">
      {/* Candidate video */}
      <div className="bg-gray-800 rounded-xl overflow-hidden mb-4 relative" style={{ aspectRatio: "4/3" }}>
        {videoEnabled ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-400">{user?.name?.charAt(0) || "U"}</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">You</div>
        {interviewStarted && showCaptions && (isListening || liveTranscript) && (
          <div className="absolute bottom-10 left-2 right-2 px-3 py-2 bg-black/70 backdrop-blur rounded-lg text-sm text-white text-center">
            {liveTranscript || <span className="text-white/70 animate-pulse">Listening — speak now…</span>}
          </div>
        )}
        {interviewStarted && !interviewEnded && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 rounded text-xs text-white flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> REC
          </div>
        )}
      </div>

      {/* AI interviewer panel */}
      <div className="bg-gray-800 rounded-xl overflow-hidden relative" style={{ aspectRatio: "4/3" }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <VideoOff className="w-7 h-7 text-gray-400" aria-hidden="true" />
            </div>
            <p className="text-white font-medium">AI Interviewer</p>
            <p className="text-gray-400 text-xs mt-1">
              {liveVideoAvailable
                ? "Live interviewer video appears when you start the interview."
                : "Live interviewer video requires the voice-agent service."}
            </p>
            {questionNumber > 0 && (
              <p className="text-white/80 text-xs mt-2 font-medium">Q{questionNumber}/5</p>
            )}
            {interviewStarted && (
              <span className={`inline-block mt-2 px-2 py-1 rounded-full text-[10px] font-bold ${
                currentDifficulty === "easy" ? "bg-green-500/30 text-green-300 border border-green-500/50" :
                currentDifficulty === "medium" ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50" :
                "bg-red-500/30 text-red-300 border border-red-500/50"
              }`}>
                {currentDifficulty.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        {isAiSpeaking && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">Speaking...</div>
        )}
        {interviewStarted && showCaptions && isAiSpeaking && lastAiMessage && (
          <div className="absolute bottom-10 left-2 right-2 px-3 py-2 bg-black/70 backdrop-blur rounded-lg text-sm text-white text-center">
            {lastAiMessage.content.length > 180 ? lastAiMessage.content.slice(0, 180) + "…" : lastAiMessage.content}
          </div>
        )}
      </div>
    </div>
  );
}
