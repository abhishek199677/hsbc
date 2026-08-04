"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Video, VideoOff, Mic, MicOff, Phone, MessageSquare, 
  Clock, CheckCircle, Send, ArrowRight, Star, Loader
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function LiveInterviewContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (interviewStarted && !interviewEnded) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewStarted, interviewEnded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (videoEnabled) {
      startVideo();
    } else {
      stopVideo();
    }
    return () => stopVideo();
  }, [videoEnabled]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to get video:", error);
      setVideoEnabled(false);
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          profile: {
            name: user?.name || "Candidate",
            currentRole: "Software Engineer",
            totalExperience: "3+ years",
            skills: "JavaScript, React, Node.js",
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages([{ role: "assistant", content: data.message }]);
        setInterviewStarted(true);
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isAiTyping) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsAiTyping(true);

    try {
      const response = await fetch("/api/ai-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          userMessage,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        if (data.isComplete) {
          setTimeout(() => endInterview(), 2000);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsAiTyping(false);
    }
  };

  const endInterview = async () => {
    setInterviewEnded(true);
    stopVideo();
    
    try {
      const response = await fetch("/api/ai-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          profile: { name: user?.name || "Candidate", currentRole: "Software Engineer" },
          conversationHistory: messages,
        }),
      });

      const data = await response.json();
      if (data.success) {
        try {
          const evalData = JSON.parse(data.evaluation);
          setEvaluation(evalData);
        } catch {
          setEvaluation({ raw: data.evaluation });
        }
      }
    } catch (error) {
      console.error("Failed to evaluate:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (interviewEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white">Interview Complete!</h1>
              <p className="text-white/80 mt-2">Thank you for completing the AI interview</p>
            </div>
            
            <div className="p-8">
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{formatTime(elapsedTime)}</p>
                  <p className="text-sm text-gray-500">Duration</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{messages.length}</p>
                  <p className="text-sm text-gray-500">Exchanges</p>
                </div>
              </div>

              {evaluation ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Interview Evaluation</h3>
                  
                  {evaluation.score && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Score:</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`w-5 h-5 ${i <= evaluation.score / 2 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <span className="font-bold text-gray-900">{evaluation.score}/10</span>
                    </div>
                  )}

                  {evaluation.strengths && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {evaluation.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.areasForImprovement && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-1">
                        {evaluation.areasForImprovement.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-yellow-700">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.recommendation && (
                    <div className={`rounded-lg p-4 text-center ${evaluation.recommendation === "Hire" ? "bg-green-100" : evaluation.recommendation === "Consider" ? "bg-yellow-100" : "bg-red-100"}`}>
                      <p className="text-sm text-gray-600">Recommendation</p>
                      <p className={`text-xl font-bold ${evaluation.recommendation === "Hire" ? "text-green-700" : evaluation.recommendation === "Consider" ? "text-yellow-700" : "text-red-700"}`}>
                        {evaluation.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Loader className="animate-spin h-8 w-8 text-indigo-600 mx-auto" />
                  <p className="text-gray-500 mt-2">Generating evaluation...</p>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button onClick={() => router.push("/confirmation")} className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  View Confirmation
                </button>
                <button onClick={() => router.push("/")} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="HireRight" className="h-8 w-auto" />
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded">AI Interview</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">15:00</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${Math.min((elapsedTime / 900) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="w-1/3 p-4 flex flex-col">
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
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl overflow-hidden relative" style={{ aspectRatio: "4/3" }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-5xl">🤖</span>
                </div>
                <p className="text-white font-medium">AI Interviewer</p>
                <p className="text-white/70 text-sm">HireRight</p>
              </div>
            </div>
            {isAiTyping && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">Speaking...</div>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <button onClick={() => setVideoEnabled(!videoEnabled)} className={`w-12 h-12 rounded-full flex items-center justify-center ${videoEnabled ? "bg-gray-700 text-white" : "bg-red-600 text-white"}`}>
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button onClick={() => setAudioEnabled(!audioEnabled)} className={`w-12 h-12 rounded-full flex items-center justify-center ${audioEnabled ? "bg-gray-700 text-white" : "bg-red-600 text-white"}`}>
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button onClick={endInterview} className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700">
              <Phone className="w-5 h-5 rotate-[135deg]" />
            </button>
          </div>
        </div>

        <div className="w-2/3 p-4 flex flex-col">
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
                    <p className="text-gray-400 mb-6">Click the button below to begin your 15-minute AI interview</p>
                    <button onClick={startInterview} disabled={loading} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 mx-auto">
                      {loading ? (
                        <><Loader className="animate-spin w-4 h-4" /> Connecting...</>
                      ) : (
                        <>Start Interview <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your answer..."
                    className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                    disabled={isAiTyping}
                  />
                  <button onClick={sendMessage} disabled={!currentMessage.trim() || isAiTyping} className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
