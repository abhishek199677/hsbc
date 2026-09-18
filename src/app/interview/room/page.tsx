"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Camera,
  CameraOff,
  Mic,
  Volume2,
  VolumeX,
  AudioLines,
  Wifi,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader,
  Video,
  Lock,
  ShieldCheck,
  Sparkles,
  Layout,
  Layers,
  Server,
  BarChart3,
  Brain,
  Briefcase,
  Sun,
  Monitor,
  MessagesSquare,
  GraduationCap,
  Clock,
} from "lucide-react";

type DeviceStatus = "idle" | "checking" | "ready" | "denied" | "unavailable";

interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: RecognitionResultLike };
}
type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

const getSpeechRecognition = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

const getAudioCtxCtor = (): typeof AudioContext => {
  if (typeof window === "undefined") return AudioContext;
  const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext || w.webkitAudioContext || AudioContext;
};

const roleTracks = [
  { id: "frontend", label: "Frontend Developer", icon: Layout, desc: "React · UI · Web performance" },
  { id: "fullstack", label: "Full Stack Engineer", icon: Layers, desc: "Frontend + Backend + APIs" },
  { id: "backend", label: "Backend Developer", icon: Server, desc: "APIs · Databases · Systems" },
  { id: "data", label: "Data Analyst", icon: BarChart3, desc: "SQL · Dashboards · Insights" },
  { id: "ai", label: "AI / ML Engineer", icon: Brain, desc: "LLMs · Models · Pipelines" },
  { id: "pm", label: "Product Manager", icon: Briefcase, desc: "Roadmap · Discovery · Delivery" },
];

const levels = [
  { id: "fresher", label: "Fresher", sub: "0 years" },
  { id: "1-3", label: "1–3 years", sub: "Junior" },
  { id: "3-6", label: "3–6 years", sub: "Mid-level" },
  { id: "6+", label: "6+ years", sub: "Senior" },
];

const tips = [
  { icon: Sun, text: "Sit in a quiet, well-lit space" },
  { icon: ShieldCheck, text: "Anti-cheating monitor is ON — keep looking at the camera" },
  { icon: Monitor, text: "Look at the camera when you answer" },
  { icon: MessagesSquare, text: "Speak clearly — I listen and transcribe live" },
  { icon: Clock, text: "You have up to 3 minutes per question" },
];

export default function InterviewRoomPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const [cameraStatus, setCameraStatus] = useState<DeviceStatus>("idle");
  const [micStatus, setMicStatus] = useState<DeviceStatus>("idle");
  const [speakerStatus, setSpeakerStatus] = useState<DeviceStatus>("idle");
  const [speechStatus, setSpeechStatus] = useState<DeviceStatus>("idle");
  const [networkStatus, setNetworkStatus] = useState<"idle" | "checking" | "ready" | "unavailable">("idle");
  const [latency, setLatency] = useState<number | null>(null);

  const [audioLevel, setAudioLevel] = useState(0);
  const [mirror, setMirror] = useState(true);
  const [videoSize, setVideoSize] = useState<string | null>(null);
  const [showCameraFailover, setShowCameraFailover] = useState(false);
  const [continueWithoutCamera, setContinueWithoutCamera] = useState(false);
  const [speakerHeard, setSpeakerHeard] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({ quiet: false, devices: false, outLoud: false });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamGenRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const [joining, setJoining] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);

  const displayName = user?.name || "Candidate";

  const stopMedia = useCallback(() => {
    streamGenRef.current++;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    }
  }, []);

  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const Ctx = getAudioCtxCtor();
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setAudioLevel(Math.min(1, sum / (data.length * 255 * 2)));
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setAudioLevel(0);
    }
  }, []);

  const runChecks = useCallback(async () => {
    stopMedia();
    setCameraStatus("checking");
    setMicStatus("checking");
    setNetworkStatus("checking");
    setAudioLevel(0);
    setShowCameraFailover(false);

    const gen = ++streamGenRef.current;

    // Try video + audio first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (gen !== streamGenRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraStatus("ready");
      setMicStatus("ready");
      setShowCameraFailover(false);
      startMeter(stream);
    } catch (err) {
      if (gen !== streamGenRef.current) return;
      console.warn("[camera] getUserMedia failed:", err);

      // Try video only
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (gen !== streamGenRef.current) {
          videoStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = videoStream;
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          videoRef.current.play().catch(() => {});
        }
        setCameraStatus("ready");
        setMicStatus("denied");
        setShowCameraFailover(false);
        startMeter(videoStream);
      } catch {
        if (gen !== streamGenRef.current) return;
        setCameraStatus("denied");
      }

      // Try audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (gen !== streamGenRef.current) {
          audioStream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (!streamRef.current) streamRef.current = audioStream;
        setMicStatus("ready");
        startMeter(audioStream);
      } catch {
        if (gen !== streamGenRef.current) return;
        setMicStatus("unavailable");
      }

      // If both camera and mic failed, show failover
      if (cameraStatus === "denied" && micStatus === "unavailable") {
        setShowCameraFailover(true);
      }
    }

    const start = performance.now();
    try {
      await fetch(`/logo.png?t=${Date.now()}`, { cache: "no-store" });
      setLatency(Math.round(performance.now() - start));
      setNetworkStatus("ready");
    } catch {
      setNetworkStatus("unavailable");
    }
  }, [startMeter, stopMedia]);

  useEffect(() => {
    const timer = setTimeout(() => runChecks(), 0);
    return () => {
      clearTimeout(timer);
      stopMedia();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [runChecks, stopMedia]);

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStatus, continueWithoutCamera]);

  const toggleMirror = () => setMirror((m) => !m);

  const playTestTone = async () => {
    try {
      const Ctx = getAudioCtxCtor();
      const ctx = audioCtxRef.current || new Ctx();
      await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.1);
      setSpeakerStatus("checking");
    } catch {
      setSpeakerStatus("unavailable");
    }
  };

  const confirmSpeaker = () => {
    setSpeakerStatus("ready");
    setSpeakerHeard(true);
  };

  const testSpeech = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setSpeechStatus("unavailable");
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setSpeechStatus("checking");
    setSpeechTranscript("");

    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;

    let final = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      const text = (final + interim).trim();
      setSpeechTranscript(text);
      if (text.length > 0) {
        setSpeechStatus("ready");
      }
    };
    rec.onerror = () => setSpeechStatus("unavailable");
    rec.onend = () => {
      if (recognitionRef.current === rec) recognitionRef.current = null;
      if (final.trim().length === 0 && speechStatus === "checking") setSpeechStatus("idle");
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setSpeechStatus("unavailable");
    }
  };

  const micBarCount = 32;
  const checklistComplete = checklist.quiet && checklist.devices && checklist.outLoud;
  const roleLevelReady = !!selectedRole && !!selectedLevel;
  const cameraOk = cameraStatus === "ready" || continueWithoutCamera;

  const checksPassed = [
    cameraOk,
    micStatus === "ready",
    speakerStatus === "ready",
    speechStatus === "ready" || speechStatus === "unavailable",
    networkStatus === "ready",
    roleLevelReady,
    checklistComplete,
  ].filter(Boolean).length;

  const readiness = Math.round((checksPassed / 7) * 100);
  const canJoin = roleLevelReady && checklistComplete && cameraOk && !!interviewId;

  const handleJoin = () => {
    if (!canJoin || !interviewId || joining) return;
    setJoining(true);
    try {
      sessionStorage.setItem("tcRole", selectedRole || "");
      sessionStorage.setItem("tcLevel", selectedLevel || "");
      sessionStorage.setItem("tcNoCamera", continueWithoutCamera ? "1" : "0");
    } catch {}
    router.push(`/interview/live?id=${interviewId}`);
  };

  useEffect(() => {
    const existing = sessionStorage.getItem("tcInterviewId");
    if (existing) {
      setInterviewId(existing);
      return;
    }
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/interview", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (!cancelled && data.success && data.interview?.id) {
          sessionStorage.setItem("tcInterviewId", data.interview.id);
          setInterviewId(data.interview.id);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [token, router]);

  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - readiness / 100);

  const statusBadge = (status: DeviceStatus, extra?: string) => {
    if (status === "checking")
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e050b0]/10 text-[#a78bfa] border border-[#e050b0]/20 text-xs font-medium font-mono"><Loader className="w-3 h-3 animate-spin" /> Checking...</span>;
    if (status === "ready")
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#4dacde]/10 text-[#f5c542] border border-[#4dacde]/20 text-xs font-medium font-mono"><CheckCircle2 className="w-3.5 h-3.5" /> Ready{extra ? ` · ${extra}` : ""}</span>;
    if (status === "denied")
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium font-mono"><XCircle className="w-3.5 h-3.5" /> Blocked</span>;
    if (status === "unavailable")
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium font-mono"><XCircle className="w-3.5 h-3.5" /> Unavailable</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#18181b] text-[#a1a1aa] border border-[#27272a] text-xs font-medium font-mono">Not tested</span>;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <header className="relative z-10 border-b border-[#27272a] bg-[#18181b]/70 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/interview")}
            className="flex items-center gap-3 group"
          >
            <div className="bg-[#27272a] backdrop-blur-sm p-1.5">
              <img src="/logo.png" alt="HireRight" className="h-6 w-auto drop-shadow-md" />
            </div>
            <span className="px-2 py-0.5 bg-[#e050b0] text-white text-xs font-medium font-mono uppercase tracking-wider">
              AI Interview Room
            </span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#a1a1aa] font-mono">
              <ShieldCheck className="w-4 h-4 text-[#f5c542]" />
              Secure & private session
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#e050b0] flex items-center justify-center ring-2 ring-[#e050b0]/30">
                <span className="text-sm font-semibold text-white">{displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-medium text-white font-mono">Hi, {displayName}</p>
                <p className="text-xs text-[#a1a1aa] font-mono">Pre-interview check</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: interviewer + devices */}
          <section className="lg:col-span-3 space-y-6">
            <div className="border border-[#27272a] bg-[#e050b0]/10 p-6 flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#27272a] backdrop-blur flex items-center justify-center flex-shrink-0 ring-4 ring-[#e050b0]/20">
                <span className="text-5xl">🤖</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">{displayName}</h1>
                  <span className="px-2 py-0.5 bg-[#e050b0]/20 text-[11px] font-medium text-[#a78bfa] font-mono uppercase tracking-wider">
                    AI Interviewer · HireRight
                  </span>
                </div>
                <p className="text-[#a1a1aa] text-sm mt-1 font-mono">
                  Let&apos;s make sure everything is ready before you step in. I&apos;ll be
                  asking your questions out loud — you answer by speaking.
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[#f5c542] font-mono">
                  <span className="w-2 h-2 bg-[#4dacde] animate-pulse" />
                  Online & ready to interview you
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-center gap-1">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - readiness / 100)} className="transition-all duration-700" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white font-mono">{readiness}%</span>
                </div>
                <p className="text-[10px] text-[#a1a1aa] font-mono">Ready</p>
              </div>
            </div>

            {/* Camera card */}
            <div className="border border-[#27272a] bg-[#18181b] overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold text-white font-mono uppercase tracking-wider">
                      <Camera className="w-4 h-4 text-[#a78bfa]" />
                      Camera
                    </h2>
                    <p className="text-xs text-[#a1a1aa] mt-0.5 font-mono">Your video feed — stay centered and visible</p>
                  </div>
                  {statusBadge(cameraStatus, continueWithoutCamera ? "off" : videoSize || undefined)}
                </div>
              </div>

              <div className="relative bg-[#09090b] mx-4 sm:mx-5 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      const w = videoRef.current.videoWidth;
                      const h = videoRef.current.videoHeight;
                      setVideoSize(`${w}×${h}`);
                    }
                  }}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${cameraStatus === "ready" && !continueWithoutCamera ? "opacity-100" : "opacity-0"}`}
                  style={{ transform: mirror ? "scaleX(-1)" : "none" }}
                />
                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${cameraStatus === "ready" && !continueWithoutCamera ? "pointer-events-none opacity-0" : ""}`}>
                  <div className="w-20 h-20 bg-[#27272a] flex items-center justify-center">
                    {cameraStatus === "checking" ? (
                      <Loader className="w-8 h-8 text-[#a1a1aa] animate-spin" />
                    ) : (
                      <span className="text-3xl font-bold text-[#a1a1aa] font-mono">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#a1a1aa] font-mono">
                    {cameraStatus === "checking"
                      ? "Requesting camera access..."
                      : continueWithoutCamera
                      ? "Camera is off — you will answer without video"
                      : "Camera unavailable"}
                  </p>
                </div>
                {cameraStatus === "ready" && !continueWithoutCamera && (
                  <>
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-[#09090b]/60 text-xs text-white font-mono">You</span>
                    <span className="absolute top-2 left-2 px-2 py-1 bg-[#4dacde]/20 border border-[#4dacde]/30 text-[11px] text-[#f5c542] flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 bg-[#4dacde] animate-pulse" /> LIVE
                    </span>
                    <button
                      onClick={toggleMirror}
                      className="absolute bottom-2 right-2 px-3 py-1.5 bg-[#09090b]/60 hover:bg-[#09090b]/80 text-xs text-white font-mono"
                    >
                      {mirror ? "Mirror: On" : "Mirror: Off"}
                    </button>
                  </>
                )}
              </div>

              {showCameraFailover && cameraStatus !== "ready" && !continueWithoutCamera && (
                <div className="mx-4 sm:mx-5 mt-4 p-5 border-2 border-[#e050b0]/40 bg-[#e050b0]/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-[#f5c542]" />
                    <p className="text-sm text-[#f5c542] font-mono font-bold">
                      Camera & Microphone Blocked
                    </p>
                  </div>
                  <p className="text-xs text-[#a1a1aa] font-mono mb-3">
                    Chrome blocked access. You need to allow it manually:
                  </p>
                  <div className="bg-[#09090b] border border-[#27272a] p-3 mb-3 font-mono text-xs text-[#a1a1aa] space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[#a78bfa] font-bold">1.</span>
                      <span>Click the <strong className="text-white">tune icon (⚙️)</strong> or <strong className="text-white">lock icon (🔒)</strong> to the LEFT of the URL bar</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#a78bfa] font-bold">2.</span>
                      <span>Find <strong className="text-white">Camera</strong> → set to <strong className="text-[#22c55e]">Allow</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#a78bfa] font-bold">3.</span>
                      <span>Find <strong className="text-white">Microphone</strong> → set to <strong className="text-[#22c55e]">Allow</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#a78bfa] font-bold">4.</span>
                      <span>Click <strong className="text-white">Retry Camera</strong> below</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCameraStatus("checking");
                        setMicStatus("checking");
                        setShowCameraFailover(false);
                        runChecks();
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#a78bfa] text-white text-sm font-bold font-mono hover:bg-[#8b5cf6] transition-colors rounded"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Camera & Mic
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#27272a] border border-[#3f3f46] text-[#a1a1aa] text-sm font-medium hover:bg-[#3f3f46] font-mono transition-colors rounded"
                    >
                      Reload Page
                    </button>
                    <button
                      onClick={() => setContinueWithoutCamera(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#27272a] border border-[#3f3f46] text-[#a1a1aa] text-sm font-medium hover:bg-[#3f3f46] font-mono transition-colors rounded"
                    >
                      <CameraOff className="w-4 h-4" />
                      Skip
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mic + speaker cards */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="border border-[#27272a] bg-[#18181b] p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold text-white font-mono uppercase tracking-wider">
                      <Mic className="w-4 h-4 text-[#a78bfa]" />
                      Microphone
                    </h2>
                    <p className="text-xs text-[#a1a1aa] mt-0.5 font-mono">Speak naturally — I listen live</p>
                  </div>
                  {statusBadge(micStatus)}
                </div>

                <div className="flex items-end justify-center gap-1 h-16 bg-[#09090b] border border-[#27272a] px-4">
                  {Array.from({ length: micBarCount }).map((_, i) => {
                    const peak = (i / micBarCount) * 1.15;
                    const level = micStatus === "ready" ? Math.max(audioLevel * 1.4 - peak, 0) : 0;
                    const active = level > 0.02;
                    return (
                      <div
                        key={i}
                        className="flex-1 max-w-[6px] transition-all duration-75"
                        style={{
                          height: `${Math.max(8, level * 100)}%`,
                          background: active ? "linear-gradient(to top,#e050b0,#4dacde)" : "#2a2a2a",
                          boxShadow: active ? "0 0 12px rgba(224,80,176,0.5)" : "none",
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#a1a1aa] mt-3 flex items-center gap-1.5 font-mono">
                  <AudioLines className="w-3.5 h-3.5" />
                  {micStatus === "ready"
                    ? audioLevel > 0.15
                      ? "Great — we can hear you clearly!"
                      : "Audio detected. Try speaking a little closer."
                    : "Microphone level will show here once detected."}
                </p>
              </div>

              <div className="border border-[#27272a] bg-[#18181b] p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold text-white font-mono uppercase tracking-wider">
                      <Volume2 className="w-4 h-4 text-[#f5c542]" />
                      Speaker & AI voice
                    </h2>
                    <p className="text-xs text-[#a1a1aa] mt-0.5 font-mono">Make sure you can hear me ask questions</p>
                  </div>
                  {statusBadge(speakerStatus)}
                </div>

                <button
                  onClick={playTestTone}
                  disabled={speakerStatus === "checking"}
                  className="w-full py-3 bg-[#4dacde]/20 border border-[#4dacde]/30 text-[#f5c542] text-sm font-medium hover:bg-[#4dacde]/30 disabled:opacity-60 flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
                >
                  <Volume2 className="w-4 h-4" />
                  Play test sound
                </button>

                {speakerStatus === "checking" && (
                  <div className="mt-3 p-3 border border-[#27272a] bg-[#27272a] text-sm text-white">
                    <p className="mb-3 flex items-center gap-2 font-mono">
                      <VolumeX className="w-4 h-4 text-[#a78bfa]" />
                      Did you hear the tone?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={confirmSpeaker}
                        className="flex-1 py-2 bg-[#4dacde] text-white text-sm font-medium hover:bg-[#4dacde]/80 font-mono uppercase tracking-wider"
                      >
                        Yes, I heard it
                      </button>
                      <button
                        onClick={() => setSpeakerStatus("idle")}
                        className="flex-1 py-2 bg-[#27272a] text-sm font-medium hover:bg-[#2a2a2a] font-mono uppercase tracking-wider"
                      >
                        No, retry
                      </button>
                    </div>
                  </div>
                )}
                {speakerHeard && (
                  <p className="text-[11px] text-[#f5c542] mt-3 flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Speaker confirmed — you&apos;ll hear every question clearly.
                  </p>
                )}
              </div>
            </div>

            {/* Speech + network */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="border border-[#27272a] bg-[#18181b] p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold text-white font-mono uppercase tracking-wider">
                      <MessagesSquare className="w-4 h-4 text-[#f5c542]" />
                      Voice recognition
                    </h2>
                    <p className="text-xs text-[#a1a1aa] mt-0.5 font-mono">Confirm I can transcribe your voice</p>
                  </div>
                  {statusBadge(speechStatus)}
                </div>
                <button
                  onClick={testSpeech}
                  disabled={speechStatus === "checking"}
                  className="w-full py-3 bg-[#4dacde]/15 border border-[#4dacde]/30 text-[#f5c542] text-sm font-medium hover:bg-[#4dacde]/25 disabled:opacity-60 flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
                >
                  <Mic className="w-4 h-4" />
                  {speechStatus === "checking" ? "Listening — say something..." : "Test my voice"}
                </button>
                {speechTranscript && (
                  <p className="mt-3 p-3 bg-[#09090b] border border-[#27272a] text-sm text-white italic font-mono">
                    &quot;{speechTranscript}&quot;
                  </p>
                )}
                {speechStatus === "idle" && (
                  <p className="text-[11px] text-[#a1a1aa] mt-3 font-mono">
                    Click the button, then say <span className="text-white">&quot;Hello {displayName}, I am ready&quot;</span>.
                  </p>
                )}
                {speechStatus === "unavailable" && (
                  <div className="mt-3 p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
                    <p className="text-sm text-[#a1a1aa]">
                      Voice recognition isn&apos;t available in this browser. You can <span className="text-white font-medium">type your answers</span> during the interview — it works perfectly.
                    </p>
                    <p className="text-xs text-[#a1a1aa]/70 mt-2">
                      For voice input, use <span className="text-[#a78bfa]">Chrome</span>, <span className="text-[#a78bfa]">Edge</span>, or <span className="text-[#a78bfa]">Safari</span>.
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-[#27272a] bg-[#18181b] p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold text-white font-mono uppercase tracking-wider">
                      <Wifi className="w-4 h-4 text-[#f5c542]" />
                      Connection
                    </h2>
                    <p className="text-xs text-[#a1a1aa] mt-0.5 font-mono">Stable internet keeps your video smooth</p>
                  </div>
                  {networkStatus === "ready" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#4dacde]/10 text-[#f5c542] border border-[#4dacde]/20 text-xs font-medium font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {latency !== null ? `${latency}ms` : "Stable"}
                    </span>
                  ) : networkStatus === "checking" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e050b0]/10 text-[#a78bfa] border border-[#e050b0]/20 text-xs font-medium font-mono">
                      <Loader className="w-3 h-3 animate-spin" /> Checking...
                    </span>
                  ) : networkStatus === "unavailable" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium font-mono">
                      <XCircle className="w-3.5 h-3.5" /> Offline
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#18181b] text-[#a1a1aa] border border-[#27272a] text-xs font-medium font-mono">Not tested</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1">
                    <p className="text-white font-mono">
                      {networkStatus === "ready"
                        ? latency !== null && latency < 150
                          ? "Excellent — great connection for a video interview."
                          : latency !== null && latency < 400
                          ? "Good connection. Should be fine for video."
                          : "Weak connection. Try a wired or stronger network."
                        : networkStatus === "checking"
                        ? "Measuring your connection..."
                        : "Could not measure your connection."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={runChecks}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#27272a] bg-[#27272a] text-sm font-medium hover:bg-[#2a2a2a] text-white font-mono uppercase tracking-wider"
            >
              <RefreshCw className="w-4 h-4" />
              Recheck devices
            </button>
          </section>

          {/* RIGHT: role, level, checklist, CTA */}
          <aside className="lg:col-span-2 space-y-6">
            <div className="border border-[#27272a] bg-[#18181b] p-5">
              <h2 className="font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-[#a78bfa]" />
                Role Track
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5 mb-4 font-mono">What role are you interviewing for?</p>
              <div className="grid grid-cols-2 gap-2">
                {roleTracks.map((track) => {
                  const Icon = track.icon;
                  const active = selectedRole === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => setSelectedRole(track.id)}
                      className={`text-left p-3 border transition-all ${
                        active
                          ? "border-[#e050b0]/60 bg-[#e050b0]/15 ring-1 ring-[#e050b0]/40"
                          : "border-[#27272a] bg-[#27272a] hover:bg-[#27272a]/80"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${active ? "text-[#a78bfa]" : "text-[#a1a1aa]"}`} />
                      <p className={`text-sm font-medium leading-tight ${active ? "text-white" : "text-[#a1a1aa]"} font-mono`}>
                        {track.label}
                      </p>
                      <p className="text-[11px] text-[#a1a1aa] mt-0.5 font-mono">{track.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#27272a] bg-[#18181b] p-5">
              <h2 className="font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-[#a78bfa]" />
                Experience Level
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5 mb-4 font-mono">Pick the level that matches your experience</p>
              <div className="grid grid-cols-2 gap-2">
                {levels.map((level) => {
                  const active = selectedLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setSelectedLevel(level.id)}
                      className={`text-left p-3 border transition-all ${
                        active
                          ? "border-[#e050b0]/60 bg-[#e050b0]/15 ring-1 ring-[#e050b0]/40"
                          : "border-[#27272a] bg-[#27272a] hover:bg-[#27272a]/80"
                      }`}
                    >
                      <p className={`text-sm font-medium ${active ? "text-white" : "text-[#a1a1aa]"} font-mono`}>{level.label}</p>
                      <p className="text-[11px] text-[#a1a1aa] font-mono">{level.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#27272a] bg-[#18181b] p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#a78bfa]" />
                  Before you join
                </h2>
                <span className="text-[11px] text-[#a1a1aa] font-mono">Required</span>
              </div>
              <ul className="space-y-2.5 mt-4 mb-5">
                {tips.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <li key={tip.text} className="flex items-start gap-3 text-sm text-[#a1a1aa] font-mono">
                      <span className="w-7 h-7 bg-[#27272a] border border-[#27272a] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#a78bfa]" />
                      </span>
                      {tip.text}
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-2.5">
                <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${checklist.quiet ? "border-[#4dacde]/40 bg-[#4dacde]/10" : "border-[#27272a] bg-[#27272a] hover:bg-[#27272a]/80"}`}>
                  <input
                    type="checkbox"
                    checked={checklist.quiet}
                    onChange={(e) => setChecklist((c) => ({ ...c, quiet: e.target.checked }))}
                    className="sr-only"
                  />
                  <span className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 ${checklist.quiet ? "bg-[#4dacde] border-[#4dacde]" : "border-[#a0a0a0]"}`}>
                    {checklist.quiet && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                  <span className="text-sm text-white font-mono">I am in a quiet place</span>
                </label>

                <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${checklist.devices ? "border-[#4dacde]/40 bg-[#4dacde]/10" : "border-[#27272a] bg-[#27272a] hover:bg-[#27272a]/80"}`}>
                  <input
                    type="checkbox"
                    checked={checklist.devices}
                    onChange={(e) => setChecklist((c) => ({ ...c, devices: e.target.checked }))}
                    className="sr-only"
                  />
                  <span className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 ${checklist.devices ? "bg-[#4dacde] border-[#4dacde]" : "border-[#a0a0a0]"}`}>
                    {checklist.devices && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                  <span className="text-sm text-white font-mono">My camera & mic are ready</span>
                </label>

                <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${checklist.outLoud ? "border-[#4dacde]/40 bg-[#4dacde]/10" : "border-[#27272a] bg-[#27272a] hover:bg-[#27272a]/80"}`}>
                  <input
                    type="checkbox"
                    checked={checklist.outLoud}
                    onChange={(e) => setChecklist((c) => ({ ...c, outLoud: e.target.checked }))}
                    className="sr-only"
                  />
                  <span className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 ${checklist.outLoud ? "bg-[#4dacde] border-[#4dacde]" : "border-[#a0a0a0]"}`}>
                    {checklist.outLoud && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                  <span className="text-sm text-white font-mono">I will answer out loud</span>
                </label>
              </div>
            </div>

            <div className="border border-[#27272a] bg-[#e050b0]/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-14 h-14">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="url(#readinessGrad)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                        className="transition-all duration-700"
                      />
                      <defs>
                        <linearGradient id="readinessGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#e050b0" />
                          <stop offset="100%" stopColor="#4dacde" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white font-mono">{readiness}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white font-mono">Room readiness</p>
                    <p className="text-[11px] text-[#a1a1aa] font-mono">{checksPassed}/7 checks passed</p>
                  </div>
                </div>
              </div>

              {!canJoin && (
                <ul className="text-[12px] text-[#a1a1aa] space-y-1.5 mb-4 font-mono">
                  {!roleLevelReady && (
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#e050b0]" /> Select a role track & level
                    </li>
                  )}
                  {!checklistComplete && (
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#e050b0]" /> Complete the checklist above
                    </li>
                  )}
                  {!cameraOk && (
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#e050b0]" /> Allow camera or choose to continue without it
                    </li>
                  )}
                </ul>
              )}

              <button
                onClick={handleJoin}
                disabled={!canJoin || joining}
                className={`w-full py-3.5 font-semibold flex items-center justify-center gap-2 transition-all font-mono uppercase tracking-wider ${
                  canJoin
                    ? "bg-[#4dacde] text-black hover:bg-[#4dacde]/80"
                    : "bg-[#27272a] text-[#a1a1aa] cursor-not-allowed border border-[#27272a]"
                }`}
              >
                {joining ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Entering interview...</>
                ) : (
                  <><Video className="w-4 h-4" /> Start Live Interview</>
                )}
              </button>
              {!canJoin && (
                <p className="text-center text-[11px] text-[#a78bfa] mt-2 flex items-center justify-center gap-1 font-mono">
                  <Lock className="w-3 h-3" />
                  {!interviewId
                    ? "Loading interview session..."
                    : !roleLevelReady && !checklistComplete
                    ? "Pick a role, level & tick the checklist to enable"
                    : !roleLevelReady
                    ? "Pick a role track & level to enable"
                    : "Complete the checklist above to enable"}
                </p>
              )}
              <p className="text-center text-[11px] text-[#a1a1aa] mt-3 flex items-center justify-center gap-1 font-mono">
                <Lock className="w-3 h-3" />
                Your data is encrypted & secure
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
