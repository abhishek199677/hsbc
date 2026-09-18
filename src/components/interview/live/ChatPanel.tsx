import {
  MessageSquare, Video, Mic, Send, Wifi, WifiOff, ArrowRight, Loader, ShieldCheck, Calendar,
} from "lucide-react";
import type { ChatPanelProps } from "./types";

export default function ChatPanel({
  messages,
  interviewStarted,
  isAiTyping,
  isListening,
  liveTranscript,
  showManualInput,
  useKeyboard,
  manualInput,
  noCamera,
  supportsSpeech,
  liveKitAvailable,
  liveKitLoading,
  liveKitError,
  loading,
  proctorStatus,
  proctorLoading,
  startError,
  wordCount,
  setManualInput,
  sendManual,
  startInterview,
  startLiveKitInterview,
  messagesEndRef,
}: ChatPanelProps) {
  return (
    <div className="flex-1 p-4 flex flex-col">
      <div className="bg-gray-800 rounded-xl flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span className="text-white font-medium">Interview Chat</span>
          </div>
          <span className="text-gray-400 text-sm">{messages.length} messages</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!interviewStarted ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to Start?</h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  {noCamera
                    ? "The AI interviewer will ask questions out loud and you answer by speaking. Your voice is recorded for the evaluator to review."
                    : "The AI interviewer will ask questions out loud and you answer by speaking. Your camera and voice are recorded for the evaluator to review."}
                </p>
                {!noCamera && (
                  <div className={`mb-4 text-xs rounded-lg p-3 flex items-start gap-2 text-left ${
                    proctorStatus.state === "ok" || proctorStatus.state === "violating"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                      : proctorLoading
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                      : "bg-gray-700/40 border border-gray-600/40 text-gray-400"
                  }`}>
                    <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Anti-cheating monitoring is {proctorStatus.state === "off" && !proctorLoading ? "not available" : "active"}:</strong>{" "}
                      keep looking at the camera. Turning your head, looking away, or hiding your face is flagged as malpractice and appears in your evaluation.
                    </span>
                  </div>
                )}
                {startError && startError === "__NO_INTERVIEW__" ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm rounded-lg p-4 mb-4 text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                    <p className="font-medium mb-1">No interview scheduled</p>
                    <p className="text-amber-400/70 text-xs mb-3">You need to schedule an interview before you can start.</p>
                    <a
                      href="/interview"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg font-medium text-sm hover:bg-amber-400 transition-colors"
                    >
                      Schedule Interview <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                ) : startError ? (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
                    {startError}
                  </div>
                ) : null}
                {liveKitError && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-lg p-3 mb-4 flex items-start gap-2">
                    <WifiOff className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{liveKitError}</span>
                  </div>
                )}

                {liveKitAvailable && (
                  <div className="space-y-3">
                    <button
                      onClick={startLiveKitInterview}
                      disabled={liveKitLoading}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {liveKitLoading ? (
                        <><Loader className="animate-spin w-4 h-4" /> Connecting to AI agent...</>
                      ) : (
                        <><Wifi className="w-4 h-4" /> Start Voice Interview <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      Real-time voice with AI interviewer
                    </div>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
                      <div className="relative flex justify-center text-xs"><span className="bg-gray-900 px-2 text-gray-500">or</span></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={startInterview}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 mx-auto ${
                    liveKitAvailable
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {loading ? (
                    <><Loader className="animate-spin w-4 h-4" /> Connecting...</>
                  ) : (
                    <>Start Browser Interview <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                {!liveKitAvailable && !supportsSpeech && (
                  <p className="text-yellow-500 text-sm mt-4">
                    Voice input is not supported in this browser. You can type your answers instead.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-700 text-white rounded-bl-none"}`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🤖</span>
                        <span className="text-xs text-indigo-300">AI Interviewer</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {liveTranscript && (
                <div className="flex justify-end">
                  <div className="bg-indigo-800 text-indigo-100 rounded-2xl rounded-br-none px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="w-3 h-3 text-indigo-300 animate-pulse" />
                      <span className="text-xs text-indigo-300">Listening...</span>
                    </div>
                    <p className="text-sm leading-relaxed">{liveTranscript}</p>
                  </div>
                </div>
              )}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {interviewStarted && (
          <div className="p-4 border-t border-gray-700">
            {isListening ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
                </div>
                <span className="text-indigo-200 text-sm">Listening — speak your answer now</span>
                {wordCount > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-100 rounded-full text-xs font-medium">
                    {wordCount} words
                  </span>
                )}
              </div>
            ) : showManualInput || !supportsSpeech || useKeyboard ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendManual()}
                  placeholder="Type your answer..."
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                  disabled={isAiTyping}
                />
                <button onClick={sendManual} disabled={!manualInput.trim() || isAiTyping} className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Mic className="w-4 h-4 text-gray-500" />
                Getting ready...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
