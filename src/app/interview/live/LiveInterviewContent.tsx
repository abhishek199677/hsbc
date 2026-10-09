"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile, buildPlaybackUrl } from "@/lib/uploadFile";
import {
  createProctor,
  type ProctorHandle,
  type ProctorIncident,
  type ProctoringReport,
  type ProctorStatus,
} from "@/lib/proctor";
import { 
  Clock, CheckCircle, Star, Loader, Download, ScrollText, ListChecks, Volume2,
  AlertTriangle, ShieldCheck, Lock, FileDown, FileCode
} from "lucide-react";
import PayPalUnlockButton from "@/components/PayPalUnlockButton";
import { generateReportPdf } from "@/lib/generateReportPdf";
import dynamic from "next/dynamic";
import type { ChallengeQuestion, TestCaseResult } from "@/lib/sandbox";
import InterviewHeader from "@/components/interview/live/InterviewHeader";
import VideoPanels from "@/components/interview/live/VideoPanels";
import InterviewControls from "@/components/interview/live/InterviewControls";
import ChatPanel from "@/components/interview/live/ChatPanel";
import TranscriptPanel from "@/components/interview/live/TranscriptPanel";
import SavingOverlay from "@/components/interview/live/SavingOverlay";

// Dynamically import the LiveKit room component (no SSR — it needs browser APIs)
const LiveKitInterviewRoom = dynamic(
  () => import("@/components/LiveKitInterviewRoom"),
  { ssr: false, loading: () => <Loader className="animate-spin w-8 h-8 text-[#a78bfa]" /> }
);

// Dynamically import the CodingChallenge component (no SSR — Monaco needs browser APIs)
const CodingChallenge = dynamic(
  () => import("@/components/CodingChallenge"),
  { ssr: false, loading: () => <Loader className="animate-spin w-8 h-8 text-[#a78bfa]" /> }
);

const PROCTOR_INCIDENT_LABELS: Record<string, string> = {
  look_away: "Looked away from camera",
  face_hidden: "Face not visible",
  multiple_faces: "Multiple people in frame",
  eyes_closed: "Eyes closed",
};

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

interface QuestionScore {
  question: string;
  answer: string;
  score: number;
  feedback?: string;
}

interface Evaluation {
  score?: number;
  recommendation?: "Hire" | "Consider" | "Reject";
  strengths?: string[];
  weaknesses?: string[];
  areasForImprovement?: string[];
  topicsToLearn?: string[];
  questionScores?: QuestionScore[];
  [key: string]: unknown;
}

const getSpeechRecognition = (): SpeechRecognitionClass | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionClass;
    webkitSpeechRecognition?: SpeechRecognitionClass;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export default function LiveInterviewContent() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

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
  const [noCamera, setNoCamera] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [captionUrl, setCaptionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [supportsSpeech] = useState(() => typeof window !== "undefined" && getSpeechRecognition() !== null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [useKeyboard, setUseKeyboard] = useState(false);
  const [hasStream, setHasStream] = useState(false);
  const [proctorStatus, setProctorStatus] = useState<ProctorStatus>({ state: "off" });
  const [proctorLoading, setProctorLoading] = useState(false);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const [proctorReport, setProctorReport] = useState<ProctoringReport | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [resultsUnlocked, setResultsUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("unlocked") === "success";
  });

  // LiveKit state — determines whether to use the real-time WebRTC pipeline
  // or fall back to browser Speech API
  const [liveKitAvailable, setLiveKitAvailable] = useState<boolean | null>(null); // null = checking
  const [liveKitConfig, setLiveKitConfig] = useState<{
    roomName: string;
    token: string;
    url: string;
  } | null>(null);
  const [liveKitLoading, setLiveKitLoading] = useState(false);
  const [liveKitError, setLiveKitError] = useState<string | null>(null);

  // Coding challenge state
  const [codingMode, setCodingMode] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeQuestion | null>(null);
  const [codingLoading, setCodingLoading] = useState(false);

  // Adaptive interview state (70/30 split)
  const [interviewPhase, setInterviewPhase] = useState<"warmup" | "skill" | "coding" | "followup" | "wrapup">("warmup");
  const [codingCount, setCodingCount] = useState(0);
  const [skillCount, setSkillCount] = useState(0);
  const [performanceScores, setPerformanceScores] = useState<number[]>([]);
  const [lastWasCoding, setLastWasCoding] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamGenRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionClass> | null>(null);
  const listeningRef = useRef(false);
  const endedRef = useRef(false);
  const aiTypingRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const recordingStartRef = useRef<number>(0);
  const cuesRef = useRef<{ role: "user" | "assistant"; startMs: number }[]>([]);
  const proctorRef = useRef<ProctorHandle | null>(null);

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

  // Check if LiveKit agent is available on mount
  useEffect(() => {
    async function checkLiveKit() {
      try {
        const res = await fetch("/api/ai-agent");
        const data = await res.json();
        setLiveKitAvailable(data.available === true);
      } catch {
        setLiveKitAvailable(false);
      }
    }
    checkLiveKit();
  }, []);

  // Verify interview exists on mount — redirect to /interview if not
  useEffect(() => {
    if (authLoading || !user || !token) return;
    let cancelled = false;
    (async () => {
      try {
        // First check sessionStorage for a known ID
        const stored = sessionStorage.getItem("tcInterviewId");
        if (stored) {
          // Verify it's still valid
          const res = await fetch("/api/interview", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.interview?.id) {
              if (!cancelled) sessionStorage.setItem("tcInterviewId", data.interview.id);
              return;
            }
          }
          // Stored ID is stale — clear it
          sessionStorage.removeItem("tcInterviewId");
        }

        // No valid interview — fetch to confirm
        const res = await fetch("/api/interview", { credentials: "include" });
        if (cancelled) return;
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 404 || !res.ok) {
          // No interview scheduled — show error with link to schedule
          setStartError("__NO_INTERVIEW__");
          return;
        }
        const data = await res.json();
        if (data.success && data.interview?.id) {
          sessionStorage.setItem("tcInterviewId", data.interview.id);
        } else {
          setStartError("__NO_INTERVIEW__");
        }
      } catch {
        // Network error — will be handled when user tries to start
      }
    })();
    return () => { cancelled = true; };
  }, [user, token, authLoading, router]);

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
      stopProctor();
      stopMedia();
    };
  }, []);

  async function startPreview() {
    const gen = ++streamGenRef.current;
    const noCamera = typeof window !== "undefined" && sessionStorage.getItem("tcNoCamera") === "1";
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        noCamera ? { video: false, audio: true } : { video: true, audio: true }
      );
      if (gen !== streamGenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasStream(true);
      setNoCamera(noCamera);
      setVideoEnabled(!noCamera);
      initProctor();
    } catch (error) {
      if (gen !== streamGenRef.current) return;
      console.error("Failed to get media:", error);
      setHasStream(false);
      setNoCamera(noCamera);
      setVideoEnabled(false);
      setStartError(
        "Microphone access is required for the recorded interview. Please allow mic access and reload the page."
      );
    }
  }

  function stopMedia() {
    streamGenRef.current++;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setHasStream(false);
  }

  const playWarningBeep = () => {
    try {
      const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
      const Ctx = window.AudioContext || w.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      osc.onended = () => ctx.close();
    } catch {}
  };

  const initProctor = async () => {
    if (proctorRef.current || typeof window === "undefined") return;
    const noCameraMode = sessionStorage.getItem("tcNoCamera") === "1";
    if (noCameraMode || !videoRef.current) {
      setProctorStatus({ state: "off" });
      return;
    }
    setProctorLoading(true);
    try {
      const handle = await createProctor(
        videoRef.current,
        {
          onStatus: (status) => setProctorStatus(status),
          onIncident: (incident: ProctorIncident, report: ProctoringReport) => {
            setProctorReport(report);
            setProctorWarnings((w) => w + 1);
            playWarningBeep();
          },
        },
        {}
      );
      proctorRef.current = handle;
      handle.start();
      setProctorLoading(false);
      setProctorStatus({ state: "ok" });
    } catch (error) {
      console.error("Failed to start proctoring:", error);
      setProctorLoading(false);
      setProctorStatus({ state: "off" });
      setProctorReport({
        enabled: false,
        reason: "Proctoring engine could not be loaded on this device.",
        durationMs: 0,
        incidents: [],
        lookAwayCount: 0,
        faceHiddenCount: 0,
        multipleFacesCount: 0,
        eyesClosedCount: 0,
        totalLookAwayMs: 0,
        result: "off",
      });
    }
  };

  const stopProctor = (): ProctoringReport | null => {
    if (proctorRef.current) {
      const report = proctorRef.current.stop();
      proctorRef.current = null;
      return report;
    }
    return null;
  };

  useEffect(() => {
    if (interviewStarted && !interviewEnded) {
      proctorRef.current?.start();
    }
  }, [interviewStarted, interviewEnded]);

  const startRecorder = () => {
    if (!streamRef.current || typeof MediaRecorder === "undefined") return;
    try {
      const recorder = new MediaRecorder(streamRef.current);
      recorderChunksRef.current = [];
      recordingStartRef.current = performance.now();
      cuesRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recorderChunksRef.current.push(e.data);
      };
      recorder.onerror = (e) => {
        console.error("Recorder error:", e);
      };
      recorder.start(1000);
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
    if (recordingStartRef.current) {
      cuesRef.current.push({ role, startMs: performance.now() - recordingStartRef.current });
    }
  };

  const formatVttTime = (ms: number) => {
    const total = Math.max(0, Math.floor(ms));
    const hh = Math.floor(total / 3600000);
    const mm = Math.floor((total % 3600000) / 60000);
    const ss = Math.floor((total % 60000) / 1000);
    const mmm = total % 1000;
    const pad = (n: number, l = 2) => n.toString().padStart(l, "0");
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}.${pad(mmm, 3)}`;
  };

  const buildVtt = (messages: Message[], cues: { role: "user" | "assistant"; startMs: number }[], durationMs: number) => {
    const lines: string[] = ["WEBVTT", ""];
    cues.forEach((cue, i) => {
      const msg = messages[i];
      if (!msg) return;
      const start = cue.startMs;
      const end = cues[i + 1] ? cues[i + 1].startMs : Math.min(durationMs, start + Math.max(4000, msg.content.length * 100));
      if (end <= start) return;
      const speaker = msg.role === "user" ? "Candidate" : "AI Interviewer";
      lines.push(`${formatVttTime(start)} --> ${formatVttTime(end)}`);
      lines.push(`${speaker}: ${msg.content}`);
      lines.push("");
    });
    return lines.join("\n");
  };

  const callAI = async (action: string, extra: Record<string, unknown> = {}) => {
    const response = await fetch("/api/ai-interview", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        ...extra,
        interviewState: {
          messageCount: messages.length,
          difficulty: currentDifficulty,
          phase: interviewPhase,
          codingCount,
          skillCount,
          performanceScores,
          lastWasCoding,
        },
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || `API error ${response.status}`);
    }
    return data;
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
      const done = () => {
        clearTimeout(timeout);
        setIsAiSpeaking(false);
        resolve();
      };
      const timeout = setTimeout(done, Math.min(Math.max(text.length * 120, 4000), 20000));
      utterance.onend = done;
      utterance.onerror = done;
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
    recognition.lang = "en-IN";
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
        setTimeout(() => startListening(), 400);
      }
    };

    recognition.onerror = (event) => {
      listeningRef.current = false;
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setShowManualInput(true);
      } else if (!endedRef.current) {
        setTimeout(() => startListening(), 600);
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

  function stopListening() {
    listeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }

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
        setCurrentDifficulty(data.difficulty || currentDifficulty);
        setInterviewPhase(data.phase || interviewPhase);
        if (data.codingCount !== undefined) setCodingCount(data.codingCount);
        if (data.skillCount !== undefined) setSkillCount(data.skillCount);
        if (data.performanceScores) setPerformanceScores(data.performanceScores);
        if (data.lastWasCoding !== undefined) setLastWasCoding(data.lastWasCoding);

        // If the API triggered a coding challenge, launch it
        if (data.triggerCoding) {
          await speakText(data.message);
          pushMessage("assistant", data.message);
          startCodingChallenge();
        } else {
          pushMessage("assistant", data.message);
          if (data.isComplete) {
            await speakText(data.message);
            await finishInterview();
          } else {
            await speakText(data.message);
            if (!endedRef.current && !useKeyboard) startListening();
          }
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

  /**
   * Start the interview using the LiveKit real-time audio pipeline.
   * Calls the ai-agent API to create a room and dispatch the Python agent.
   */
  const startLiveKitInterview = async () => {
    if (liveKitLoading) return;
    setLiveKitLoading(true);
    setLiveKitError(null);
    try {
      // Get the interview ID from the URL or session
      let interviewId = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("id") || sessionStorage.getItem("tcInterviewId")
        : null;

      // Fallback: fetch from API if not available locally
      if (!interviewId) {
        try {
          const fallbackRes = await fetch("/api/interview", { credentials: "include" });
          if (fallbackRes.status === 401) {
            router.replace("/login");
            return;
          }
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.success && fallbackData.interview?.id) {
              interviewId = String(fallbackData.interview.id);
              sessionStorage.setItem("tcInterviewId", interviewId);
            }
          }
        } catch {}
      }

      if (!interviewId) {
        throw new Error("interviewId is required — please go back and rejoin the interview");
      }

      // Cap the wait: the API confirms the agent joined before replying, so a
      // hung request must not leave the candidate on "Connecting…" forever.
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interviewId }),
        signal: AbortSignal.timeout(30_000),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create interview room");
      }

      // Store the LiveKit config — this will render the LiveKitInterviewRoom component
      setLiveKitConfig({
        roomName: data.roomName,
        token: data.token,
        url: data.url,
      });
      setInterviewStarted(true);
    } catch (error) {
      console.error("Failed to start LiveKit interview:", error);
      const timedOut =
        typeof DOMException !== "undefined" &&
        error instanceof DOMException &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      const msg = timedOut
        ? "Timed out waiting for the AI interviewer to join. Try again, or start the browser interview."
        : error instanceof Error
        ? error.message
        : "";
      if (msg === "Interview not found" || msg.includes("interviewId is required")) {
        setStartError("__NO_INTERVIEW__");
      } else {
        setLiveKitError(msg || "Failed to connect to the AI interviewer. Falling back to browser mode.");
        // Fall back to browser Speech API
        setLiveKitAvailable(false);
      }
    } finally {
      setLiveKitLoading(false);
    }
  };

  /**
   * Re-dispatch the agent into the room the candidate is already sitting in —
   * used by the "Try again" button when the agent never joined. The candidate's
   * WebRTC connection (camera, mic, room) is left untouched.
   */
  const redispatchAgent = async () => {
    try {
      let interviewId = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("id") || sessionStorage.getItem("tcInterviewId")
        : null;

      if (!interviewId) {
        const res = await fetch("/api/interview", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.interview?.id) {
            interviewId = String(data.interview.id);
            sessionStorage.setItem("tcInterviewId", interviewId);
          }
        }
      }
      if (!interviewId) return;

      const res = await fetch("/api/ai-agent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        console.error("Agent re-dispatch failed:", data.error || res.status);
      }
    } catch (error) {
      console.error("Agent re-dispatch failed:", error);
    }
  };

  /**
   * Handle LiveKit room disconnection — trigger evaluation and show results.
   */
  const handleLiveKitDisconnect = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setSaving(true);
    setSavingStatus("Evaluating your interview...");

    // For LiveKit mode, we evaluate using the conversation history from the agent
    // The agent handles the actual interview — we just need to get the evaluation
    try {
      const storedRole = typeof window !== "undefined" ? sessionStorage.getItem("tcRole") : null;
      const data = await callAI("evaluate", {
        profile: {
          name: user?.name || "Candidate",
          currentRole: storedRole || "Software Engineer",
        },
        conversationHistory: [], // The agent tracked the conversation server-side
      });
      if (data.success) {
        let parsedEvaluation: Evaluation | null = null;
        try {
          parsedEvaluation = JSON.parse(data.evaluation);
        } catch {
          parsedEvaluation = { raw: data.evaluation };
        }
        setEvaluation(parsedEvaluation);
      }
    } catch (error) {
      console.error("Evaluation failed:", error);
    }

    setSaving(false);
    setInterviewEnded(true);
  }, [user, token]);

  /**
   * Request a coding challenge from the AI interviewer.
   */
  const startCodingChallenge = useCallback(async () => {
    if (codingLoading) return;
    setCodingLoading(true);
    try {
      const data = await callAI("coding_challenge", {
        difficulty: currentDifficulty,
      });
      if (data.success && data.challenge) {
        setCurrentChallenge(data.challenge);
        setCodingMode(true);
        setCodingCount(data.codingCount || codingCount + 1);
        pushMessage("assistant", `Let's try a coding challenge: ${data.challenge.title}`);
      }
    } catch (error) {
      console.error("Failed to get coding challenge:", error);
    } finally {
      setCodingLoading(false);
    }
  }, [codingLoading, currentDifficulty, codingCount]);

  /**
   * Handle code submission from the CodingChallenge component.
   * Sends the code and results to the AI for evaluation.
   */
  const handleCodeSubmit = useCallback(async (
    code: string,
    results: TestCaseResult[],
    allPassed: boolean
  ) => {
    try {
      // Send code submission to AI for feedback
      const data = await callAI("submit_code", {
        challenge: currentChallenge,
        codeResults: results,
        code,
      });

      if (data.success) {
        // Track coding performance (score 0-10 based on pass rate)
        const codingScore = data.totalCount > 0 ? Math.round((data.passedCount / data.totalCount) * 10) : 5;
        setPerformanceScores((prev) => [...prev, codingScore]);
        setLastWasCoding(true);

        // Add the coding feedback to conversation
        const feedback = data.feedback || "Good effort on the coding challenge!";
        pushMessage("assistant", feedback);

        // If all tests passed, AI is impressed; otherwise, provide guidance
        if (allPassed) {
          pushMessage("assistant", "Excellent! All test cases passed. Let me ask you a follow-up question.");
        } else {
          pushMessage("assistant", `You passed ${data.passedCount}/${data.totalCount} test cases. Let's continue with the next question.`);
        }
      }
    } catch (error) {
      console.error("Failed to submit code:", error);
    }

    // Exit coding mode
    setCodingMode(false);
    setCurrentChallenge(null);

    // Continue the interview with voice questions
    if (!endedRef.current && !useKeyboard) {
      startListening();
    }
  }, [currentChallenge, useKeyboard]);

  /**
   * Skip the coding challenge and return to voice questions.
   */
  const skipCodingChallenge = useCallback(() => {
    setCodingMode(false);
    setCurrentChallenge(null);
    pushMessage("assistant", "No problem, let's continue with the next question.");
    if (!endedRef.current && !useKeyboard) {
      startListening();
    }
  }, [useKeyboard]);

  const startInterview = async () => {
    if (loading) return;
    setLoading(true);
    setStartError(null);
    try {
      const videoTrack = streamRef.current?.getVideoTracks()[0];
      const noCameraMode = typeof window !== "undefined" && sessionStorage.getItem("tcNoCamera") === "1";
      if (!streamRef.current || (!noCameraMode && (!videoTrack || videoTrack.readyState === "ended"))) {
        await startPreview();
        if (!streamRef.current) throw new Error("No media stream");
      }
      startRecorder();

      // Verify interview exists before calling AI
      const interviewId = sessionStorage.getItem("tcInterviewId");
      if (!interviewId) {
        // Try to fetch from API
        try {
          const checkRes = await fetch("/api/interview", { credentials: "include" });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.success && checkData.interview?.id) {
              sessionStorage.setItem("tcInterviewId", checkData.interview.id);
            } else {
              throw new Error("__NO_INTERVIEW__");
            }
          } else {
            throw new Error("__NO_INTERVIEW__");
          }
        } catch (e) {
          if (e instanceof Error && e.message === "__NO_INTERVIEW__") throw e;
          // Network error — proceed, AI route will handle it
        }
      }

      const storedRole = typeof window !== "undefined" ? sessionStorage.getItem("tcRole") : null;
      const storedLevel = typeof window !== "undefined" ? sessionStorage.getItem("tcLevel") : null;

      const data = await callAI("start", {
        profile: {
          name: user?.name || "Candidate",
          currentRole: storedRole || "Software Engineer",
          totalExperience: storedLevel || "1-3 years",
          skills: "As per candidate profile",
        },
      });

      if (data.success) {
        setInterviewStarted(true);
        setCurrentDifficulty(data.difficulty || "medium");
        pushMessage("assistant", data.message);
        await speakText(data.message);
        if (!endedRef.current) startListening();
      } else {
        throw new Error(data.error || "Failed to start");
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg === "__NO_INTERVIEW__" || msg === "Interview not found") {
        setStartError("__NO_INTERVIEW__");
      } else {
        setStartError("Failed to connect to the AI interviewer. Please check your internet connection and try again.");
      }
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
    const proctorReport = stopProctor();
    if (proctorReport) setProctorReport(proctorReport);
    setSaving(true);
    setSavingStatus("Stopping recording...");

    const blob = await stopRecorder();

    let url: string | null = null;
    let playbackUrl: string | null = null;
    if (blob) {
      setSavingStatus("Uploading your interview video...");
      try {
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `interview-${Date.now()}.${ext}`, { type: blob.type || "video/webm" });
        const result = await uploadFile(file, "video", token);
        url = result.url;
        playbackUrl = result.publicUrl;
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
    if (url) setVideoUrl(playbackUrl || url);

    let captionFileUrl: string | null = null;
    try {
      const vtt = buildVtt(messagesRef.current, cuesRef.current, elapsedTime * 1000);
      if (vtt.trim() !== "WEBVTT") {
        setSavingStatus("Adding captions to your video...");
        const captionFile = new File([vtt], `captions-${Date.now()}.vtt`, { type: "text/vtt" });
        const captionResult = await uploadFile(captionFile, "caption", token);
        captionFileUrl = captionResult.url;
      }
    } catch (error) {
      console.error("Caption upload failed:", error);
    }
    if (captionFileUrl) setCaptionUrl(captionFileUrl);

    setSavingStatus("Evaluating your interview...");
    let parsedEvaluation: Evaluation | null = null;
    let rawEvaluation = "";
    try {
      const data = await callAI("evaluate", {
        profile: { name: user?.name || "Candidate", currentRole: "Software Engineer" },
        conversationHistory: messagesRef.current,
        proctoring: proctorReport,
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
    const rawScore: unknown = parsedEvaluation?.score ?? null;
    const score =
      typeof rawScore === "number" && Number.isFinite(rawScore)
        ? rawScore
        : typeof rawScore === "string" && rawScore.trim() !== "" && !Number.isNaN(Number(rawScore))
          ? Number(rawScore)
          : null;
    try {
      await fetch("/api/interview", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: url,
          captionUrl,
          evaluation: rawEvaluation,
          evaluationScore: score,
          transcript,
          status: "completed",
          proctoringReport: proctorReport,
          proctoringFlags: proctorReport ? proctorReport.incidents.length : 0,
          proctoringStatus: proctorReport ? proctorReport.result : "off",
        }),
      });
    } catch (error) {
      console.error("Failed to save interview:", error);
    }

    setSaving(false);
    setSavingStatus("");
    stopMedia();
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

  const wordCount = liveTranscript.trim() ? liveTranscript.trim().split(/\s+/).filter(Boolean).length : 0;
  const questionNumber = messages.filter((m) => m.role === "assistant").length;
  const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  const pairedQa = (() => {
    const pairs: { question: string; answer: string }[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === "assistant" && messages[i + 1].role === "user") {
        pairs.push({ question: messages[i].content, answer: messages[i + 1].content });
      }
    }
    return pairs;
  })();

  const downloadTranscript = () => {
    const text = messagesRef.current
      .map((m) => `${m.role === "user" ? "Candidate" : "AI Interviewer"}: ${m.content}`)
      .join("\n");
    const blob = new Blob([`HIRERIGHT AI INTERVIEW TRANSCRIPT\n${new Date().toLocaleString()}\n\n${text}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReport = async () => {
    if (!evaluation || !resultsUnlocked) return;
    const interviewId = typeof window !== "undefined"
      ? sessionStorage.getItem("tcInterviewId") || new URLSearchParams(window.location.search).get("id")
      : null;
    if (!interviewId) return;
    try {
      const res = await fetch(`/api/interview/${interviewId}/report`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success && data.report) {
        generateReportPdf(data.report);
      }
    } catch (err) {
      console.error("Failed to download report:", err);
    }
  };

  const switchToKeyboard = () => {
    stopListening();
    setUseKeyboard(true);
    setShowManualInput(true);
  };

  // ──────────────────────────────────────────────────────────────────
  // Coding challenge mode — render the Monaco editor + problem panel
  // ──────────────────────────────────────────────────────────────────
  if (codingMode && currentChallenge && !interviewEnded) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col">
        {/* Header */}
        <header className="bg-[#18181b] border-b border-[#27272a] px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#1a1a1a] backdrop-blur-sm p-1.5">
                <img src="/logo.png" alt="HireRight" className="h-6 w-auto drop-shadow-md" />
              </div>
              <span className="px-2 py-0.5 bg-[#e050b0] text-white text-xs font-mono uppercase tracking-wider">Coding Challenge</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#a1a1aa] font-mono">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-[#a1a1aa] font-mono">
                <FileCode className="w-4 h-4" />
                <span className="text-sm">{messages.length} messages</span>
              </div>
            </div>
          </div>
        </header>

        {/* Coding challenge */}
        <div className="flex-1 min-h-0">
          <CodingChallenge
            challenge={currentChallenge}
            onSubmit={handleCodeSubmit}
            onSkip={skipCodingChallenge}
          />
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // LiveKit real-time mode — render the WebRTC interview room
  // ──────────────────────────────────────────────────────────────────
  if (liveKitConfig && !interviewEnded) {
    return (
      <LiveKitInterviewRoom
        serverUrl={liveKitConfig.url}
        token={liveKitConfig.token}
        videoEnabled={videoEnabled}
        audioEnabled={audioEnabled}
        onDisconnected={handleLiveKitDisconnect}
        onRetry={redispatchAgent}
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Loading / checking LiveKit availability
  // ──────────────────────────────────────────────────────────────────
  if (liveKitAvailable === null) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-[#a78bfa] mx-auto mb-4" />
          <p className="text-[#a1a1aa] font-mono">Checking interview connection...</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-[#a78bfa]" />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <ShieldCheck className="w-12 h-12 text-[#a78bfa] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white font-mono mb-2">Login Required</h2>
          <p className="text-[#a1a1aa] font-mono text-sm mb-4">Please log in to start your AI interview.</p>
          <a href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-[#a78bfa] text-white font-mono font-bold text-sm hover:bg-[#8b5cf6] transition-colors rounded">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (interviewEnded) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-[#18181b] overflow-hidden">
            <div className="bg-[#4dacde] p-8 text-center">
              <div className="w-20 h-20 bg-[#09090b] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-[#f5c542]" />
              </div>
              <h1 className="text-2xl font-bold text-white font-mono">Interview Complete!</h1>
              <p className="text-white/80 mt-2 font-mono">Thank you for completing the AI interview</p>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white font-mono">{formatTime(elapsedTime)}</p>
                  <p className="text-sm text-[#a1a1aa] font-mono uppercase tracking-wider">Duration</p>
                </div>
                <div className="w-px h-12 bg-[#2a2a2a]" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white font-mono">{messages.length}</p>
                  <p className="text-sm text-[#a1a1aa] font-mono uppercase tracking-wider">Exchanges</p>
                </div>
              </div>

              {proctorReport && (
                <div className={`mb-6 border p-4 ${
                  proctorReport.result === "pass"
                    ? "border-[#4dacde]/30 bg-[#4dacde]/10"
                    : proctorReport.result === "review"
                    ? "border-[#e050b0]/30 bg-[#e050b0]/10"
                    : proctorReport.result === "fail"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-[#27272a] bg-[#18181b]"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                      <ShieldCheck className="w-5 h-5 text-[#a1a1aa]" />
                      Anti-Cheating Monitor
                    </h3>
                    <span className={`px-2.5 py-1 text-xs font-bold font-mono ${
                      proctorReport.result === "pass"
                        ? "bg-[#4dacde]/20 text-[#f5c542]"
                        : proctorReport.result === "review"
                        ? "bg-[#e050b0]/20 text-[#a78bfa]"
                        : proctorReport.result === "fail"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-[#2a2a2a] text-[#a1a1aa]"
                    }`}>
                      {proctorReport.result === "pass" ? "Clean"
                        : proctorReport.result === "review" ? "Flagged for review"
                        : proctorReport.result === "fail" ? "Failed"
                        : "Not active"}
                    </span>
                  </div>
                  {proctorReport.enabled ? (
                    <>
                      <p className="text-sm text-[#a1a1aa] font-mono">
                        {proctorReport.incidents.length === 0
                          ? "No integrity violations detected. You kept facing the camera throughout."
                          : `${proctorReport.incidents.length} malpractice incident(s) were recorded during your interview.`}
                      </p>
                      {proctorReport.incidents.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {proctorReport.incidents.map((inc, i) => (
                            <li key={i} className="text-xs text-[#a1a1aa] flex items-start gap-2 font-mono">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-[#a78bfa] flex-shrink-0" />
                              <span>
                                <strong>{PROCTOR_INCIDENT_LABELS[inc.type] || inc.type}</strong>
                                {inc.detail ? ` — ${inc.detail}` : ""}
                                {` (${Math.max(1, Math.round((inc.endMs - inc.startMs) / 1000))}s)`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {proctorReport.totalLookAwayMs > 0 && (
                        <p className="mt-2 text-xs text-[#a1a1aa] font-mono">
                          Total time looking away from the camera: {Math.round(proctorReport.totalLookAwayMs / 1000)}s
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[#a1a1aa] font-mono">
                      {proctorReport.reason || "Proctoring was not active for this interview."}
                    </p>
                  )}
                </div>
              )}

              {evaluation && typeof evaluation.integrity === "string" && evaluation.integrity !== "clean" && (
                <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#a78bfa] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#a78bfa] font-mono">
                    <strong>Integrity flag:</strong> {evaluation.integrity === "failed"
                      ? "This interview was marked as failed due to suspected malpractice."
                      : "The evaluator flagged suspected malpractice in this interview."}
                  </p>
                </div>
              )}

              {videoUrl && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 font-mono uppercase tracking-wider">Your Interview Recording</h3>
                  <video
                    src={buildPlaybackUrl(videoUrl, token)}
                    controls
                    className="w-full bg-[#09090b]"
                    style={{ aspectRatio: "16/9" }}
                  >
                    {captionUrl && (
                      <track kind="captions" src={buildPlaybackUrl(captionUrl, token)} srcLang="en" label="Simple English" default />
                    )}
                  </video>
                </div>
              )}

              {evaluation ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white font-mono uppercase tracking-wider">Interview Evaluation</h3>
                    {resultsUnlocked && (
                      <button
                        onClick={downloadReport}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#e050b0] text-white text-sm font-medium hover:bg-[#e050b0]/80 font-mono uppercase tracking-wider"
                      >
                        <FileDown className="w-4 h-4" />
                        Download PDF Report
                      </button>
                    )}
                  </div>

                  {!resultsUnlocked ? (
                    <div className="relative">
                      {/* Blurred preview of evaluation */}
                      <div className="blur-sm pointer-events-none select-none opacity-60">
                        {evaluation.score != null && (
                          <div className="flex items-center gap-5 p-4 border border-[#27272a] bg-[#18181b] mb-4">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="20" fill="none" stroke="#2a2a2a" strokeWidth="5" />
                                <circle cx="24" cy="24" r="20" fill="none" stroke="#e050b0" strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * 0.3} />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white font-mono">8.5</span>
                            </div>
                            <div>
                              <p className="text-sm text-[#a1a1aa] font-mono">Exact Interview Score</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="w-5 h-5 fill-[#e050b0] text-[#a78bfa]" />
                                  ))}
                                </div>
                                <span className="font-bold text-2xl text-white font-mono">8.5<span className="text-sm text-[#a1a1aa] font-normal">/10</span></span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="bg-[#4dacde]/10 p-4 mb-4">
                          <h4 className="font-medium text-[#f5c542] mb-2 font-mono">Strengths</h4>
                          <ul className="space-y-1">
                            <li className="text-sm text-[#f5c542] flex items-start gap-2 font-mono"><CheckCircle className="w-4 h-4 mt-0.5" />Strong problem-solving skills</li>
                            <li className="text-sm text-[#f5c542] flex items-start gap-2 font-mono"><CheckCircle className="w-4 h-4 mt-0.5" />Clear communication</li>
                          </ul>
                        </div>
                        <div className="bg-[#e050b0]/10 p-4 mb-4">
                          <h4 className="font-medium text-[#a78bfa] mb-2 font-mono">Your Weaknesses</h4>
                          <ul className="space-y-1">
                            <li className="text-sm text-[#a78bfa] font-mono">Needs improvement in system design</li>
                          </ul>
                        </div>
                      </div>

                      {/* Paywall overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-[#18181b]/80 backdrop-blur-[2px]">
                        <div className="bg-[#18181b] border border-[#27272a] p-6 max-w-sm w-full text-center">
                          <div className="w-14 h-14 bg-[#e050b0]/10 flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-7 h-7 text-[#a78bfa]" />
                          </div>
                          <h4 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-wider">Unlock Your Results</h4>
                          <p className="text-sm text-[#a1a1aa] mb-1 font-mono">View your score, strengths, weaknesses, feedback, and per-question breakdown.</p>
                          <p className="text-2xl font-bold text-[#a78bfa] mb-4 font-mono">$5.99</p>
                          <PayPalUnlockButton
                            interviewId={sessionStorage.getItem("tcInterviewId") || ""}
                            priceUsd={5.99}
                            onUnlockSuccess={() => setResultsUnlocked(true)}
                          />
                          <p className="text-xs text-[#a1a1aa] mt-3 font-mono">One-time payment. Results available forever after unlock.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {evaluation.score != null && Number.isFinite(Number(evaluation.score)) && (
                        <div className="flex items-center gap-5 p-4 border border-[#27272a] bg-[#18181b]">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 48 48">
                              <circle cx="24" cy="24" r="20" fill="none" stroke="#2a2a2a" strokeWidth="5" />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                fill="none"
                                stroke={Number(evaluation.score) >= 7 ? "#4dacde" : Number(evaluation.score) >= 5 ? "#e050b0" : "#ef4444"}
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(Number(evaluation.score), 10) / 10)}
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white font-mono">
                              {Number(evaluation.score).toFixed(1)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-[#a1a1aa] font-mono">Exact Interview Score</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star key={i} className={`w-5 h-5 ${i <= Math.round(Number(evaluation.score) / 2) ? "fill-[#e050b0] text-[#a78bfa]" : "text-[#2a2a2a]"}`} />
                                ))}
                              </div>
                              <span className="font-bold text-2xl text-white font-mono">
                                {Number(evaluation.score).toFixed(1)}
                                <span className="text-sm text-gray-400 font-normal">/10</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {evaluation.strengths && (
                        <div className="bg-[#4dacde]/10 p-4">
                          <h4 className="font-medium text-[#f5c542] mb-2 font-mono">Strengths</h4>
                          <ul className="space-y-1">
                            {evaluation.strengths.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-[#f5c542] flex items-start gap-2 font-mono">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evaluation.areasForImprovement && (
                        <div className="bg-[#e050b0]/10 p-4">
                          <h4 className="font-medium text-[#a78bfa] mb-2 font-mono">Your Weaknesses</h4>
                          <ul className="space-y-1">
                            {evaluation.areasForImprovement.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-[#a78bfa] font-mono">{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evaluation.topicsToLearn && evaluation.topicsToLearn.length > 0 && (
                        <div className="bg-[#e050b0]/10 p-4">
                          <h4 className="font-medium text-[#a78bfa] mb-2 font-mono">Topics to Learn & Grow</h4>
                          <ul className="space-y-1">
                            {evaluation.topicsToLearn.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-[#a78bfa] flex items-start gap-2 font-mono">
                                <span className="w-4 h-4 bg-[#e050b0] text-white text-[10px] flex items-center justify-center mt-0.5 flex-shrink-0">
                                  {i + 1}
                                </span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evaluation.recommendation && (
                        <div className={`p-4 text-center ${evaluation.recommendation === "Hire" ? "bg-[#4dacde]/10" : evaluation.recommendation === "Consider" ? "bg-[#e050b0]/10" : "bg-red-500/10"}`}>
                          <p className="text-sm text-[#a1a1aa] font-mono uppercase tracking-wider">Overall Recommendation</p>
                          <p className={`text-xl font-bold font-mono ${evaluation.recommendation === "Hire" ? "text-[#f5c542]" : evaluation.recommendation === "Consider" ? "text-[#a78bfa]" : "text-red-400"}`}>
                            {evaluation.recommendation === "Hire"
                              ? "Hire"
                              : evaluation.recommendation === "Consider"
                              ? "Consider"
                              : "Reject / Not Selected"}
                          </p>
                        </div>
                      )}

                      {evaluation.questionScores && evaluation.questionScores.length > 0 && (
                        <div>
                          <h4 className="font-medium text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                            <ListChecks className="w-4 h-4 text-[#a78bfa]" />
                            Per-Question Breakdown
                          </h4>
                          <div className="space-y-3">
                            {evaluation.questionScores.map((q: QuestionScore, i: number) => (
                              <div key={i} className="border border-[#27272a] overflow-hidden">
                                <div className="p-3 bg-[#18181b] border-b border-[#27272a] flex items-start justify-between gap-3">
                                  <p className="text-sm text-white font-medium font-mono">
                                    <span className="text-[#a78bfa] font-bold">Q{i + 1}.</span> {q.question}
                                  </p>
                                  <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-bold font-mono ${
                                    Number(q.score) >= 7 ? "bg-[#4dacde]/20 text-[#f5c542]" : Number(q.score) >= 5 ? "bg-[#e050b0]/20 text-[#a78bfa]" : "bg-red-500/20 text-red-400"
                                  }`}>
                                    {Number(q.score).toFixed(1)}/10
                                  </span>
                                </div>
                                <div className="p-3 bg-[#18181b]">
                                  <p className="text-xs text-[#a1a1aa] mb-1 font-mono">
                                    <span className="font-semibold text-white">Your answer:</span> {q.answer}
                                  </p>
                                  {q.feedback && (
                                    <p className="text-xs text-[#a1a1aa] mt-2 flex items-start gap-1.5 font-mono">
                                      <Volume2 className="w-3.5 h-3.5 mt-0.5 text-[#a78bfa] flex-shrink-0" />
                                      {q.feedback}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Loader className="animate-spin h-8 w-8 text-[#a78bfa] mx-auto" />
                  <p className="text-[#a1a1aa] mt-2 font-mono">Generating evaluation...</p>
                </div>
              )}

              {pairedQa.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <ScrollText className="w-5 h-5 text-[#a78bfa]" />
                    Questions & Your Answers
                  </h3>
                  <div className="space-y-4">
                    {pairedQa.map((item, idx) => (
                      <div key={idx} className="border border-[#27272a] overflow-hidden">
                        <div className="p-3 bg-[#e050b0]/10 border-b border-[#27272a]">
                          <p className="text-sm text-white font-mono">
                            <span className="font-bold text-[#a78bfa]">Q{idx + 1}.</span> {item.question}
                          </p>
                        </div>
                        <div className="p-3 bg-[#18181b]">
                          <p className="text-sm text-white font-mono">
                            <span className="font-bold text-[#f5c542] mr-1">You:</span> {item.answer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={downloadTranscript}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 border border-[#27272a] text-[#a78bfa] text-sm font-medium hover:bg-[#18181b] font-mono uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" />
                    Download full transcript (.txt)
                  </button>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button onClick={() => router.push("/confirmation")} className="flex-1 py-3 border border-[#27272a] text-white font-medium hover:bg-[#18181b] font-mono uppercase tracking-wider">
                  View Confirmation
                </button>
                <button onClick={() => router.push("/")} className="flex-1 py-3 bg-[#e050b0] text-white font-medium hover:bg-[#e050b0]/80 font-mono uppercase tracking-wider">
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
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <InterviewHeader
        elapsedTime={elapsedTime}
        proctorStatus={proctorStatus}
        proctorLoading={proctorLoading}
        formatTime={formatTime}
      />

      <div className="flex-1 flex">
        <VideoPanels
          videoEnabled={videoEnabled}
          hasStream={hasStream}
          noCamera={noCamera}
          user={user}
          videoRef={videoRef}
          interviewStarted={interviewStarted}
          interviewEnded={interviewEnded}
          showCaptions={showCaptions}
          isListening={isListening}
          liveTranscript={liveTranscript}
          isAiSpeaking={isAiSpeaking}
          lastAiMessage={lastAiMessage}
          proctorStatus={proctorStatus}
          proctorWarnings={proctorWarnings}
          currentDifficulty={currentDifficulty}
          questionNumber={questionNumber}
        />

        <div className="w-1/3 p-4 flex flex-col">
          <InterviewControls
            videoEnabled={videoEnabled}
            audioEnabled={audioEnabled}
            hasStream={hasStream}
            noCamera={noCamera}
            interviewStarted={interviewStarted}
            interviewEnded={interviewEnded}
            saving={saving}
            codingLoading={codingLoading}
            codingMode={codingMode}
            useKeyboard={useKeyboard}
            showCaptions={showCaptions}
            showTranscript={showTranscript}
            toggleVideo={toggleVideo}
            toggleAudio={toggleAudio}
            finishInterview={finishInterview}
            switchToKeyboard={switchToKeyboard}
            setShowCaptions={setShowCaptions}
            setShowTranscript={setShowTranscript}
            startCodingChallenge={startCodingChallenge}
          />
        </div>

        <ChatPanel
          messages={messages}
          interviewStarted={interviewStarted}
          interviewEnded={interviewEnded}
          isAiTyping={isAiTyping}
          isListening={isListening}
          liveTranscript={liveTranscript}
          showManualInput={showManualInput}
          useKeyboard={useKeyboard}
          manualInput={manualInput}
          noCamera={noCamera}
          supportsSpeech={supportsSpeech}
          liveKitAvailable={liveKitAvailable}
          liveKitLoading={liveKitLoading}
          liveKitError={liveKitError}
          loading={loading}
          proctorStatus={proctorStatus}
          proctorLoading={proctorLoading}
          startError={startError}
          wordCount={wordCount}
          setManualInput={setManualInput}
          sendManual={sendManual}
          startInterview={startInterview}
          startLiveKitInterview={startLiveKitInterview}
          messagesEndRef={messagesEndRef}
        />

        {showTranscript && (
          <TranscriptPanel
            interviewStarted={interviewStarted}
            lastAiMessage={lastAiMessage}
            lastUserMessage={lastUserMessage}
            questionNumber={questionNumber}
            isListening={isListening}
            isAiSpeaking={isAiSpeaking}
            liveTranscript={liveTranscript}
            wordCount={wordCount}
            useKeyboard={useKeyboard}
            switchToKeyboard={switchToKeyboard}
            setShowTranscript={setShowTranscript}
          />
        )}
      </div>

      <SavingOverlay saving={saving} savingStatus={savingStatus} />
    </div>
  );
}
