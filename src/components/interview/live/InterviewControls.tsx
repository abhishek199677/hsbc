import {
  Video, VideoOff, Mic, MicOff, Phone, Captions, Keyboard, ScrollText, FileCode, Loader,
} from "lucide-react";
import type { InterviewControlsProps } from "./types";

export default function InterviewControls({
  videoEnabled,
  audioEnabled,
  hasStream,
  noCamera,
  interviewStarted,
  saving,
  codingLoading,
  codingMode,
  useKeyboard,
  showCaptions,
  showTranscript,
  toggleVideo,
  toggleAudio,
  finishInterview,
  switchToKeyboard,
  setShowCaptions,
  setShowTranscript,
  startCodingChallenge,
}: InterviewControlsProps) {
  return (
    <>
      <div className="flex justify-center gap-4 mt-4">
        <button onClick={toggleVideo} disabled={!hasStream || noCamera} className={`w-12 h-12 rounded-full flex items-center justify-center ${videoEnabled ? "bg-gray-700 text-white" : "bg-red-600 text-white"} disabled:opacity-50`}>
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleAudio} disabled={!hasStream} className={`w-12 h-12 rounded-full flex items-center justify-center ${audioEnabled ? "bg-gray-700 text-white" : "bg-red-600 text-white"} disabled:opacity-50`}>
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={finishInterview} disabled={!interviewStarted || saving} className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-50">
          <Phone className="w-5 h-5 rotate-[135deg]" />
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-3">
        <button
          onClick={() => setShowCaptions(!showCaptions)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showCaptions ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
        >
          <Captions className="w-3.5 h-3.5" /> Captions
        </button>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showTranscript ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
        >
          <ScrollText className="w-3.5 h-3.5" /> Transcript
        </button>
        {interviewStarted && (
          <button
            onClick={switchToKeyboard}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${useKeyboard ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            <Keyboard className="w-3.5 h-3.5" /> Keyboard
          </button>
        )}
        {interviewStarted && !codingMode && (
          <button
            onClick={startCodingChallenge}
            disabled={codingLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
          >
            {codingLoading ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileCode className="w-3.5 h-3.5" />
            )} Code Challenge
          </button>
        )}
      </div>
    </>
  );
}
