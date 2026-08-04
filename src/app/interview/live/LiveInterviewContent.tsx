"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Video, VideoOff, Mic, MicOff, Phone, MessageSquare, 
  Clock, CheckCircle, ArrowRight, Star, Loader, Send, Upload, Film
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type RecognitionResult = {
  isFinal: boolean;
  length: number;
  item(i: number): { transcript: string };
  [index: number]: { transcript: string };
};

type RecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    item(i: number): RecognitionResult;
    [index: number]: RecognitionResult;
  };
};

type SpeechRecognitionClass = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

const getSpeechRecognition = (): SpeechRecognitionClass | null => {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionClass || null;
};

export default function LiveInterviewContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [supportsSpeech, setSupportsSpeech] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const endedRef = useRef(false);
  const aiTypingRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    setSupportsSpeech(getSpeechRecognition() !== null);
  }, []);

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
  }, [messages, liveTranscript]);

  useEffect(() => {
    startPreview();
    return () => {
      stopListening();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      stopMedia();
    };
  }, []);

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to get media:", error);
      setStartError(
        "Camera and microphone access is required for the recorded video interview. Please allow camera and mic access and reload the page."
      );
      setVideoEnabled(false);
    }
  };

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecorder = () => {
    if (!streamRef.current || typeof MediaRecorder === "undefined") return;
    try {
      const recorder = new MediaRecorder(streamRef.current);
      recorderChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recorderChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (error) {
      console.error("Failed to start recorder:", error);
    }
  };

  const stopRecorder = () =>
    new Promise<Blob | null>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || "video/webm";
        const blob = new Blob(recorderChunksRef.current, { type });
        resolve(blob);
      };
      try {
        recorder.stop();
      } catch {
        resolve(null);
      }
    });

  const pushMessage = (role: "user" | "assistant", content: string) => {
    const msg: Message = { role, content };
    const next = [...messagesRef.current, msg];
    messagesRef.current = next;
    setMessages(next);
  };

  const callAI = async (action: string, extra: any = {}) => {
    const response = await fetch("/api/ai-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    return response.json();
  };

  const speakText = (text: string) =>
    new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }
      setIsAiSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => { setIsAiSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsAiSpeaking(false); resolve(); };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });

  const startListening = () => {
    if (listeningRef.current || endedRef.current) return;
    const SR = getSpeechRecognition();
    if (!SR) return;
    listeningRef.current = true;
    setIsListening(true);
    setLiveTranscript("");

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalText = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      setLiveTranscript(finalText + interim);
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
      const text = finalText.trim();
      if (text) {
        setLiveTranscript("");
        handleAnswer(text);
      } else if (!endedRef.current) {
        startListening();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        listeningRef.current = false;
        setIsListening(false);
        setShowManualInput(true);
      } else if (event.error === "no-speech" || event.error === "audio-capture") {
        if (!endedRef.current) {
          setTimeout(() => startListening(), 400);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      listeningRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    listeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  const handleAnswer = async (text: string) => {
    if (aiTypingRef.current || endedRef.current) return;
    aiTypingRef.current = true;
    setIsAiTyping(true);
    setLiveTranscript("");

    pushMessage("user", text);

    try {
      const data = await callAI("respond", {
        userMessage: text,
        conversationHistory: messagesRef.current,
      });

      aiTypingRef.current = false;
      setIsAiTyping(false);

      if (data.success) {
        pushMessage("assistant", data.message);
        if (data.isComplete) {
          await speakText(data.message);
          await finishInterview();
        } else {
          await speakText(data.message);
          if (!endedRef.current) startListening();
        }
      } else {
        setShowManualInput(true);
      }
    } catch (error) {
      console.error("Failed to send answer:", error);
      aiTypingRef.current = false;
      setIsAiTyping(false);
      setShowManualInput(true);
    }
  };

  const startInterview = async () => {
    if (loading) return;
    setLoading(true);
    setStartError(null);
    try {
      if (!streamRef.current) {
        await startPreview();
        if (!streamRef.current) throw new Error("No media stream");
      }
      startRecorder();

      const data = await callAI("start", {
        profile: {
          name: user?.name || "Candidate",
          currentRole: "Software Engineer",
          totalExperience: "3+ years",
          skills: "JavaScript, React, Node.js",
        },
      });

      if (data.success) {
        setInterviewStarted(true);
        pushMessage("assistant", data.message);
        await speakText(data.message);
        if (!endedRef.current) startListening();
      } else {
        throw new Error(data.error || "Failed to start");
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
      setStartError("Failed to connect to the AI interviewer. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopListening();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSaving(true);
    setSavingStatus("Stopping recording...");

    const blob = await stopRecorder();

    let url: string | null = null;
    if (blob) {
      setSavingStatus("Uploading your interview video...");
      try {
        const formData = new FormData();
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        formData.append("file", new File([blob], `interview-${Date.now()}.${ext}`, { type: blob.type || "video/webm" }));
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (uploadData.success) url = uploadData.file.url;
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
    if (url) setVideoUrl(url);

    setSavingStatus("Evaluating your interview...");
    let parsedEvaluation: any = null;
    let rawEvaluation = "";
    try {
      const data = await callAI("evaluate", {
        profile: { name: user?.name || "Candidate", currentRole: "Software Engineer" },
        conversationHistory: messagesRef.current,
      });
      if (data.success) {
        rawEvaluation = data.evaluation;
        try {
          parsedEvaluation = JSON.parse(data.evaluation);
        } catch {
          parsedEvaluation = { raw: data.evaluation };
        }
      }
    } catch (error) {
      console.error("Evaluation failed:", error);
    }
    setEvaluation(parsedEvaluation);

    setSavingStatus("Saving your results...");
    const transcript = messagesRef.current
      .map((m) => `${m.role === "user" ? "Candidate" : "AI Interviewer"}: ${m.content}`)
      .join("\n");
    const score = parsedEvaluation?.score ?? null;
    try {
      await fetch("/api/interview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: url,
          evaluation: rawEvaluation,
          evaluationScore: score,
          transcript,
          status: "completed",
        }),
      });
    } catch (error) {
      console.error("Failed to save interview:", error);
    }

    setSaving(false);
    setSavingStatus("");
    setInterviewEnded(true);
  };

  const sendManual = async () => {
    const text = manualInput.trim();
    if (!text || aiTypingRef.current) return;
    setManualInput("");
    setShowManualInput(false);
    await handleAnswer(text);
  };

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    }
  };

  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

              {videoUrl && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Interview Recording</h3>
                  <video
                    src={videoUrl}
                    controls
                    className="w-full rounded-xl bg-gray-900"
                    style={{ aspectRatio: "16/9" }}
                  />
                </div>
              )}

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
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Your Weaknesses</h4>
                      <ul className="space-y-1">
                        {evaluation.areasForImprovement.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-red-700">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.topicsToLearn && evaluation.topicsToLearn.length > 0 && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-800 mb-2">Topics to Learn & Grow</h4>
                      <ul className="space-y-1">
                        {evaluation.topicsToLearn.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-indigo-700 flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center mt-0.5 flex-shrink-0">
                              {i + 1}
                            </span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.recommendation && (
                    <div className={`rounded-lg p-4 text-center ${evaluation.recommendation === "Hire" ? "bg-green-100" : evaluation.recommendation === "Consider" ? "bg-yellow-100" : "bg-red-100"}`}>
                      <p className="text-sm text-gray-600">Overall Recommendation</p>
                      <p className={`text-xl font-bold ${evaluation.recommendation === "Hire" ? "text-green-700" : evaluation.recommendation === "Consider" ? "text-yellow-700" : "text-red-700"}`}>
                        {evaluation.recommendation === "Hire"
                          ? "Hire"
                          : evaluation.recommendation === "Consider"
                          ? "Consider"
                          : "Reject / Not Selected"}
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
            <img src="/logo.jpeg" alt="Techcitta" className="h-8 w-auto" />
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
            {interviewStarted && !interviewEnded && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 rounded text-xs text-white flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> REC
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl overflow-hidden relative" style={{ aspectRatio: "4/3" }}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-5xl">🤖</span>
                </div>
                <p className="text-white font-medium">AI Interviewer</p>
                <p className="text-white/70 text-sm">Techcitta</p>
              </div>
            </div>
            {isAiSpeaking && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">Speaking...</div>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <button onClick={toggleVideo} disabled={!streamRef.current} className={`w-12 h-12 rounded-full flex items-center justify-center ${videoEnabled ? "bg-gray-700 text-white" : "bg-red-600 text-white"} disabled:opacity-50`}>
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button onClick={toggleAudio} disabled={!streamRef.current} className={`w-12 h-12 rounded-full flex items-center justify-center ${audioEnabled ? "bg-gray-700 text-white" : "bg-red-600 text-white"} disabled:opacity-50`}>
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button onClick={finishInterview} disabled={!interviewStarted || saving} className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-50">
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
                    <p className="text-gray-400 mb-6 max-w-md">
                      The AI interviewer will ask questions out loud and you answer by speaking.
                      Your camera and voice are recorded for the evaluator to review.
                    </p>
                    {startError && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
                        {startError}
                      </div>
                    )}
                    <button onClick={startInterview} disabled={loading} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 mx-auto">
                      {loading ? (
                        <><Loader className="animate-spin w-4 h-4" /> Connecting...</>
                      ) : (
                        <>Start Interview <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                    {!supportsSpeech && (
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
                    <button
                      onClick={() => setShowManualInput(true)}
                      className="ml-auto text-xs text-indigo-300 hover:text-white underline"
                    >
                      Type instead
                    </button>
                  </div>
                ) : showManualInput || !supportsSpeech ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendManual()}
                      placeholder="Type your answer..."
                      className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                      disabled={aiTypingRef.current}
                    />
                    <button onClick={sendManual} disabled={!manualInput.trim() || aiTypingRef.current} className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <Mic className="w-4 h-4 text-gray-500" />
                    {isAiSpeaking ? "The interviewer is speaking..." : "Getting ready..."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-indigo-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Finalizing your interview</h3>
            <p className="text-gray-400 mb-4">{savingStatus}</p>
            <div className="flex items-center gap-2 justify-center text-gray-500 text-sm">
              <Film className="w-4 h-4" />
              <span>Your video recording is being processed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
