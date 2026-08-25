import { Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import type { InterviewHeaderProps } from "./types";

export default function InterviewHeader({
  elapsedTime,
  proctorStatus,
  proctorLoading,
  formatTime,
}: InterviewHeaderProps) {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5">
            <img src="/logo.png" alt="HireRight" className="h-6 w-auto rounded drop-shadow-md" />
          </div>
          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded">AI Interview</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              proctorStatus.state === "violating"
                ? "bg-red-600 text-white animate-pulse"
                : proctorStatus.state === "ok"
                ? "bg-emerald-500/20 text-emerald-300"
                : proctorLoading
                ? "bg-amber-500/20 text-amber-300"
                : "bg-gray-700 text-gray-400"
            }`}
            title={proctorStatus.state === "violating" ? (proctorStatus.detail || "Malpractice detected") : "Anti-cheating monitor"}
          >
            {proctorStatus.state === "violating" ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            {proctorStatus.state === "violating"
              ? "Alert"
              : proctorStatus.state === "ok"
              ? "Monitoring"
              : proctorLoading
              ? "Starting monitor..."
              : "Monitor off"}
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
  );
}
