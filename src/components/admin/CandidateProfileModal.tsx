"use client";

import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  Award,
  Sparkles,
  Play,
} from "lucide-react";
import { formatTimeLabel } from "@/lib/time";

export interface CandidateProfile {
  isComplete: boolean;
  resumeUrl: string | null;
  resumeFileName: string | null;
  aboutYou: string | null;
  whatDrivesYou: string | null;
  strengths: string | null;
  currentRole: string | null;
  totalExperience: string | null;
  currentLocation: string | null;
  noticePeriod: string | null;
  skills: string | null;
  currentCompany: string | null;
  education: string | null;
  jobType: string | null;
  salaryRange: string | null;
  preferredLocation: string | null;
  workMode: string | null;
  timezone: string | null;
  step: number | null;
}

export interface CandidateInterview {
  date: string | null;
  time: string | null;
  timezone: string | null;
  status: string | null;
  mode: string | null;
  type: string | null;
  duration: number | null;
  videoUrl: string | null;
  captionUrl: string | null;
  transcript: string | null;
  evaluationScore: number | null;
  evaluation: string | null;
  proctoringStatus: string | null;
  proctoringFlags: number | null;
  proctoringReport: string | null;
}

export interface CandidateUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  profile: CandidateProfile | null;
  interview: CandidateInterview | null;
}

interface CandidateProfileModalProps {
  user: CandidateUser;
  onClose: () => void;
}

function parseSkills(skills: string | null): string[] {
  if (!skills) return [];
  try {
    const parsed = JSON.parse(skills);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // fall through
  }
  return skills.split(",").map((s) => s.trim()).filter(Boolean);
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    completed: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30",
    scheduled: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30",
    in_progress: "bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30",
    cancelled: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status || ""] || "bg-[#27272a] text-[#a1a1aa] border-[#27272a]"}`}>
      {(status || "None").replace("_", " ")}
    </span>
  );
}

function ProctoringBadge({ status, flags }: { status: string | null; flags: number | null }) {
  if (!status) return null;
  const styles: Record<string, string> = {
    pass: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30",
    review: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
    fail: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30",
    off: "bg-[#27272a] text-[#a1a1aa] border-[#27272a]",
  };
  return (
    <div>
      <Badge className={`border ${styles[status] || "bg-[#27272a] text-[#a1a1aa] border-[#27272a]"}`}>
        {status === "pass" ? "Proctoring: Clean" : status === "review" ? "Proctoring: Review" : status === "fail" ? "Proctoring: Failed" : "Proctoring: Off"}
      </Badge>
      {flags && flags > 0 && (
        <p className="text-xs text-[#ef4444] mt-1">{flags} incident(s)</p>
      )}
    </div>
  );
}

export default function CandidateProfileModal({ user, onClose }: CandidateProfileModalProps) {
  const profile = user.profile;
  const interview = user.interview;
  const skills = parseSkills(profile?.skills ?? null);

  const infoRow = (
    icon: React.ReactNode,
    label: string,
    value: string | null | undefined
  ) => (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-[#a1a1aa] flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <span className="text-[#a1a1aa] text-xs block">{label}</span>
        <span className="text-[#fafafa] font-medium block break-words">{value || "—"}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto p-4">
      <div className="bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-semibold text-[#a78bfa]">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#fafafa]">{user.name || "Unnamed Candidate"}</h2>
                {profile?.isComplete ? (
                  <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30">
                    <CheckCircle className="w-3 h-3" /> Profile Complete
                  </Badge>
                ) : (
                  <Badge className="bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30">Profile Incomplete</Badge>
                )}
              </div>
              <p className="text-sm text-[#a1a1aa] mt-0.5">{profile?.currentRole || "Candidate"}</p>
              <div className="flex items-center gap-3 text-sm text-[#a1a1aa] mt-1.5 flex-wrap">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {user.phone}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#a1a1aa] hover:text-[#a1a1aa] rounded-lg hover:bg-[#27272a] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Snapshot */}
          <div>
            <h3 className="text-sm font-semibold text-[#a1a1aa] mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#a78bfa]" /> Current Snapshot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoRow(<Briefcase className="w-4 h-4" />, "Current Role", profile?.currentRole)}
              {infoRow(<Award className="w-4 h-4" />, "Total Experience", profile?.totalExperience)}
              {infoRow(<MapPin className="w-4 h-4" />, "Location", profile?.currentLocation)}
              {infoRow(<Clock className="w-4 h-4" />, "Notice Period", profile?.noticePeriod)}
              {profile?.currentCompany && infoRow(<Briefcase className="w-4 h-4" />, "Current Company", profile?.currentCompany)}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-sm font-semibold text-[#a1a1aa] mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#a78bfa]" /> Skills
            </h3>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[#a78bfa]/10 text-[#a78bfa] text-xs font-medium rounded-lg border border-[#a78bfa]/20">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#a1a1aa]">No skills listed yet.</p>
            )}
          </div>

          {/* Education */}
          {profile?.education && (
            <div>
              <h3 className="text-sm font-semibold text-[#a1a1aa] mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#a78bfa]" /> Education
              </h3>
              <p className="text-sm text-[#a1a1aa] whitespace-pre-line">{profile.education}</p>
            </div>
          )}

          {/* About */}
          {(profile?.aboutYou || profile?.whatDrivesYou || profile?.strengths) && (
            <div>
              <h3 className="text-sm font-semibold text-[#a1a1aa] mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#a78bfa]" /> About
              </h3>
              <div className="space-y-2 text-sm text-[#a1a1aa]">
                {profile?.aboutYou && <p>{profile.aboutYou}</p>}
                {profile?.whatDrivesYou && (
                  <p><span className="font-medium text-[#a1a1aa]">What drives them: </span>{profile.whatDrivesYou}</p>
                )}
                {profile?.strengths && (
                  <p><span className="font-medium text-[#a1a1aa]">Strengths: </span>{profile.strengths}</p>
                )}
              </div>
            </div>
          )}

          {/* Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-[#a1a1aa] mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#a78bfa]" /> Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoRow(<Briefcase className="w-4 h-4" />, "Job Type", profile?.jobType)}
              {infoRow(<Award className="w-4 h-4" />, "Salary Range", profile?.salaryRange)}
              {infoRow(<MapPin className="w-4 h-4" />, "Preferred Location", profile?.preferredLocation)}
              {infoRow(<Clock className="w-4 h-4" />, "Work Mode", profile?.workMode)}
              {profile?.timezone && infoRow(<Clock className="w-4 h-4" />, "Timezone", profile?.timezone)}
            </div>
          </div>

          {/* Resume */}
          {profile?.resumeUrl && (
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#a78bfa] border border-[#a78bfa]/30 rounded-lg hover:bg-[#a78bfa]/10 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {profile.resumeFileName || "View Resume"}
            </a>
          )}

          {/* Interview */}
          <div className="bg-[#18181b] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#a1a1aa] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#a78bfa]" /> Interview
              </h3>
              <StatusBadge status={interview?.status ?? null} />
            </div>

            {!interview ? (
              <p className="text-sm text-[#a1a1aa]">No interview scheduled for this candidate.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {infoRow(<Clock className="w-4 h-4" />, "Date & Time",
                    interview?.date && interview?.time
                      ? `${interview.date} at ${formatTimeLabel(interview.time)}${interview.timezone ? ` (${interview.timezone})` : ""}`
                      : null)}
                  {infoRow(<Briefcase className="w-4 h-4" />, "Mode", interview?.mode)}
                  {infoRow(<FileText className="w-4 h-4" />, "Type", interview?.type)}
                  {infoRow(<Clock className="w-4 h-4" />, "Duration", interview?.duration ? `${interview.duration} min` : null)}
                </div>

                <ProctoringBadge status={interview?.proctoringStatus ?? null} flags={interview?.proctoringFlags ?? null} />

                {interview?.evaluationScore !== null && interview?.evaluationScore !== undefined && (
                  <div>
                    <div className="flex items-center justify-between text-sm text-[#a1a1aa] mb-1">
                      <span>Interview Score</span>
                      <span className={`font-bold ${interview.evaluationScore >= 8 ? "text-[#22c55e]" : interview.evaluationScore >= 5 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
                        {interview.evaluationScore.toFixed(1)} / 10
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#27272a] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${interview.evaluationScore >= 8 ? "bg-[#22c55e]" : interview.evaluationScore >= 5 ? "bg-[#f59e0b]" : "bg-[#ef4444]"}`}
                        style={{ width: `${Math.min((interview.evaluationScore / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {interview?.evaluation && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#a1a1aa] mb-1.5">AI Evaluation</h4>
                    <div className="text-sm text-[#a1a1aa] whitespace-pre-line bg-[#18181b] rounded-lg p-3 max-h-48 overflow-y-auto">
                      {interview.evaluation}
                    </div>
                  </div>
                )}

                {interview?.transcript && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#a1a1aa] mb-1.5">Transcript</h4>
                    <div className="text-sm text-[#a1a1aa] bg-[#18181b] rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-line">
                      {interview.transcript}
                    </div>
                  </div>
                )}

                {interview?.videoUrl && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#a1a1aa] mb-1.5">Interview Recording</h4>
                    <video src={interview.videoUrl} controls className="w-full rounded-xl bg-black" />
                  </div>
                )}

                {!interview?.videoUrl && interview?.status === "completed" && (
                  <p className="text-xs text-[#a1a1aa]">Recording unavailable.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 flex items-center justify-end gap-3">
          {!interview?.videoUrl && interview?.status !== "completed" && (
            <a
              href={`/interview/live?userId=${user.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#a78bfa] hover:bg-[#8b5cf6] rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              {interview?.status === "scheduled" ? "Start Interview" : "Schedule Interview"}
            </a>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-[#fafafa] border border-[#27272a] rounded-lg hover:bg-[#27272a] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
