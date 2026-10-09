import type { ProctoringReport, ProctorStatus } from "@/lib/proctor";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface QuestionScore {
  question: string;
  answer: string;
  score: number;
  feedback?: string;
}

export interface Evaluation {
  score?: number;
  recommendation?: "Hire" | "Consider" | "Reject";
  strengths?: string[];
  weaknesses?: string[];
  areasForImprovement?: string[];
  topicsToLearn?: string[];
  questionScores?: QuestionScore[];
  integrity?: string;
  [key: string]: unknown;
}

export interface InterviewHeaderProps {
  elapsedTime: number;
  proctorStatus: ProctorStatus;
  proctorLoading: boolean;
  formatTime: (seconds: number) => string;
}

export interface VideoPanelsProps {
  videoEnabled: boolean;
  liveVideoAvailable: boolean | null;
  hasStream: boolean;
  noCamera: boolean;
  user: { name?: string | null } | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  interviewStarted: boolean;
  interviewEnded: boolean;
  showCaptions: boolean;
  isListening: boolean;
  liveTranscript: string;
  isAiSpeaking: boolean;
  lastAiMessage?: Message;
  currentDifficulty: string;
  questionNumber: number;
}

export interface InterviewControlsProps {
  videoEnabled: boolean;
  audioEnabled: boolean;
  hasStream: boolean;
  noCamera: boolean;
  interviewStarted: boolean;
  interviewEnded: boolean;
  saving: boolean;
  codingLoading: boolean;
  codingMode: boolean;
  useKeyboard: boolean;
  showCaptions: boolean;
  showTranscript: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
  finishInterview: () => void;
  switchToKeyboard: () => void;
  setShowCaptions: (v: boolean) => void;
  setShowTranscript: (v: boolean) => void;
  startCodingChallenge: () => void;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatPanelProps {
  messages: ChatMessage[];
  interviewStarted: boolean;
  interviewEnded: boolean;
  isAiTyping: boolean;
  isListening: boolean;
  liveTranscript: string;
  showManualInput: boolean;
  useKeyboard: boolean;
  manualInput: string;
  noCamera: boolean;
  supportsSpeech: boolean;
  liveKitAvailable: boolean | null;
  liveKitLoading: boolean;
  liveKitError: string | null;
  loading: boolean;
  proctorStatus: ProctorStatus;
  proctorLoading: boolean;
  startError: string | null;
  wordCount: number;
  setManualInput: (v: string) => void;
  sendManual: () => void;
  startInterview: () => void;
  startLiveKitInterview: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export interface TranscriptPanelProps {
  interviewStarted: boolean;
  lastAiMessage?: Message;
  lastUserMessage?: Message;
  questionNumber: number;
  isListening: boolean;
  isAiSpeaking: boolean;
  liveTranscript: string;
  wordCount: number;
  useKeyboard: boolean;
  switchToKeyboard: () => void;
  setShowTranscript: (v: boolean) => void;
}

export interface InterviewResultsProps {
  elapsedTime: number;
  messages: Message[];
  evaluation: Evaluation | null;
  videoUrl: string | null;
  captionUrl: string | null;
  proctorReport: ProctoringReport | null;
  resultsUnlocked: boolean;
  formatTime: (seconds: number) => string;
  downloadTranscript: () => void;
  downloadReport: () => void;
  setResultsUnlocked: (v: boolean) => void;
}

export interface SavingOverlayProps {
  saving: boolean;
  savingStatus: string;
}
