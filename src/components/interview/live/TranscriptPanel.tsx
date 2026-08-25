import { ScrollText, Mic, Volume2, Keyboard, X } from "lucide-react";
import type { TranscriptPanelProps } from "./types";

export default function TranscriptPanel({
  interviewStarted,
  lastAiMessage,
  lastUserMessage,
  questionNumber,
  isListening,
  isAiSpeaking,
  liveTranscript,
  wordCount,
  useKeyboard,
  switchToKeyboard,
  setShowTranscript,
}: TranscriptPanelProps) {
  return (
    <div className="w-80 shrink-0 p-4 pl-0 flex flex-col">
      <div className="bg-gray-800 rounded-xl flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">Live Transcript</span>
          </div>
          <button
            onClick={() => setShowTranscript(false)}
            className="text-gray-400 hover:text-white"
            aria-label="Close transcript"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!interviewStarted ? (
            <div className="text-center py-10">
              <ScrollText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Live captions will appear here once the interview starts.</p>
            </div>
          ) : (
            <>
              {lastAiMessage && (
                <div>
                  <p className="text-xs text-indigo-300 font-medium mb-2 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" /> Question {questionNumber}
                  </p>
                  <div className="bg-gray-700/60 rounded-xl p-3 text-sm text-white leading-relaxed">
                    {lastAiMessage.content}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> Your answer
                  </p>
                  <span className="text-[11px] text-gray-400">
                    {isListening ? `${wordCount} words` : lastUserMessage ? `${(lastUserMessage.content.trim().split(/\s+/).filter(Boolean) || []).length} words` : "0 words"}
                  </span>
                </div>
                <div className="rounded-xl p-3 text-sm min-h-[90px] leading-relaxed border border-indigo-500/30 bg-indigo-600/10 text-indigo-100">
                  {isListening ? (
                    liveTranscript ? (
                      liveTranscript
                    ) : (
                      <span className="text-indigo-300 animate-pulse">Listening — speak your answer now…</span>
                    )
                  ) : lastUserMessage ? (
                    lastUserMessage.content
                  ) : (
                    <span className="text-indigo-300/70">Speak now. Your answer appears here in real time.</span>
                  )}
                </div>
              </div>

              {isAiSpeaking && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  The interviewer is speaking the question out loud…
                </div>
              )}
            </>
          )}
        </div>

        {interviewStarted && (
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={switchToKeyboard}
              className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                useKeyboard
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              {useKeyboard ? "Keyboard mode on" : "Use keyboard to answer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
