"use client";

import { useState, useEffect, useMemo } from "react";
import CandidateProfileModal, { type CandidateUser } from "@/components/admin/CandidateProfileModal";
import {
  Users,
  UserCheck,
  Calendar,
  CheckCircle,
  Award,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Play,
  Briefcase,
  Star,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Eye,
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";

interface CandidatePipelineProps {
  token: string | null;
}

type User = CandidateUser;

interface FunnelStage {
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ElementType;
  dropOff: number;
  dropOffPct: number;
}

interface CandidateData {
  user: User;
  score: number | null;
  recommendation: string;
  yearsExp: number;
  strengths: string[];
  weaknesses: string[];
  skills: string[];
}

const FUNNEL_COLORS = {
  registered: { bg: "bg-[#3b82f6]", light: "bg-[#3b82f6]/10", text: "text-[#3b82f6]", fill: "#3b82f6" },
  profileComplete: { bg: "bg-[#a78bfa]/100", light: "bg-indigo-100", text: "text-[#a78bfa]", fill: "#6366f1" },
  interviewScheduled: { bg: "bg-[#a855f7]", light: "bg-[#a855f7]/10", text: "text-[#a855f7]", fill: "#a855f7" },
  interviewCompleted: { bg: "bg-[#22c55e]", light: "bg-[#22c55e]/10", text: "text-[#22c55e]", fill: "#22c55e" },
  highScore: { bg: "bg-[#10b981]", light: "bg-[#10b981]/10", text: "text-[#10b981]", fill: "#10b981" },
  recommended: { bg: "bg-green-600", light: "bg-[#22c55e]/10", text: "text-[#22c55e]", fill: "#16a34a" },
};

function parseExperience(exp: string | null): number {
  if (!exp) return 0;
  const match = exp.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseSkills(skills: string | null): string[] {
  if (!skills) return [];
  try {
    const parsed = JSON.parse(skills);
    if (Array.isArray(parsed)) return parsed;
    return String(skills).split(",").map((s) => s.trim()).filter(Boolean);
  } catch {
    return String(skills).split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function getRecommendation(user: User): string {
  if (!user.interview) return "pending";
  const score = user.interview.evaluationScore;
  if (score === null || score === undefined) return "pending";
  if (score >= 8) return "hire";
  if (score >= 5) return "consider";
  return "reject";
}

function SkeletonLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-[#27272a] rounded w-64 mb-2" />
        <div className="h-4 bg-[#27272a] rounded w-80" />
      </div>

      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
        <div className="h-5 bg-[#27272a] rounded w-40 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 bg-[#27272a] rounded-lg flex-1" />
              <div className="h-6 bg-[#27272a] rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
          <div className="h-5 bg-[#27272a] rounded w-44 mb-6" />
          <div className="h-64 bg-[#27272a] rounded-lg" />
        </div>
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
          <div className="h-5 bg-[#27272a] rounded w-36 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#27272a] rounded-full" />
                <div className="flex-1 h-4 bg-[#27272a] rounded" />
                <div className="h-5 bg-[#27272a] rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
        <div className="h-5 bg-[#27272a] rounded w-48 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-[#27272a] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CandidateData }> }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const rec = data.recommendation;
  const recColor = rec === "hire" ? "text-[#22c55e]" : rec === "consider" ? "text-[#f59e0b]" : rec === "reject" ? "text-[#ef4444]" : "text-[#a1a1aa]";

  return (
    <div className="bg-[#18181b] px-4 py-3 rounded-lg shadow-lg border border-[#27272a] max-w-xs">
      <p className="text-sm font-semibold text-[#fafafa] truncate">{data.user.name || data.user.email}</p>
      <div className="mt-1.5 space-y-0.5">
        <p className="text-xs text-[#a1a1aa]">
          Score: <span className="font-medium text-[#a1a1aa]">{data.score ?? "N/A"}</span>
        </p>
        <p className="text-xs text-[#a1a1aa]">
          Experience: <span className="font-medium text-[#a1a1aa]">{data.yearsExp} yrs</span>
        </p>
        <p className={`text-xs font-medium capitalize ${recColor}`}>
          {rec === "pending" ? "Not yet interviewed" : rec}
        </p>
      </div>
    </div>
  );
}

function ScoreBar({ score, max = 10 }: { score: number | null; max?: number }) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-[#a1a1aa]">N/A</span>;
  }
  const pct = Math.min((score / max) * 100, 100);
  const color = score >= 8 ? "bg-[#22c55e]" : score >= 5 ? "bg-[#f59e0b]" : "bg-[#ef4444]";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-[#27272a] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-[#a1a1aa] w-8 text-right">{score}</span>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const styles: Record<string, string> = {
    hire: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30",
    consider: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
    reject: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30",
    pending: "bg-[#27272a] text-[#a1a1aa] border-[#27272a]",
  };

  const labels: Record<string, string> = {
    hire: "Hire",
    consider: "Consider",
    reject: "Reject",
    pending: "Pending",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[recommendation] || styles.pending}`}>
      {labels[recommendation] || recommendation}
    </span>
  );
}

function ProfileBadge({ isComplete }: { isComplete: boolean }) {
  return isComplete ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30">
      <CheckCircle className="w-3 h-3" />
      Complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30">
      Incomplete
    </span>
  );
}

export default function CandidatePipeline({ token }: CandidatePipelineProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch("/api/admin/users");

        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setError("Unauthorized. Please log in again.");
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          if (data.success) setUsers(data.users);
          else setError("Failed to load candidates");
        }
      } catch {
        if (!cancelled) setError("Failed to load candidate data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [token]);

  const candidates = useMemo<CandidateData[]>(() => {
    return users.map((user) => {
      const score = user.interview?.evaluationScore ?? null;
      const recommendation = getRecommendation(user);
      const yearsExp = parseExperience(user.profile?.totalExperience ?? null);
      const skills = parseSkills(user.profile?.skills ?? null);

      return {
        user,
        score,
        recommendation,
        yearsExp,
        strengths: [],
        weaknesses: [],
        skills,
      };
    });
  }, [users]);

  const funnelStages = useMemo<FunnelStage[]>(() => {
    const total = candidates.length;
    const registered = total;
    const profileComplete = candidates.filter((c) => c.user.profile?.isComplete === true).length;
    const interviewScheduled = candidates.filter((c) => c.user.interview !== null).length;
    const interviewCompleted = candidates.filter((c) => c.user.interview?.status === "completed").length;
    const highScore = candidates.filter((c) => c.score !== null && c.score >= 7).length;
    const recommended = candidates.filter((c) => c.user.interview?.evaluationScore !== null && getRecommendation(c.user) === "hire").length;

    const counts = [registered, profileComplete, interviewScheduled, interviewCompleted, highScore, recommended];
    const labels = ["Registered", "Profile Complete", "Interview Scheduled", "Interview Completed", "High Score (7+)", "Recommended for Hire"];
    const colors = [
      FUNNEL_COLORS.registered,
      FUNNEL_COLORS.profileComplete,
      FUNNEL_COLORS.interviewScheduled,
      FUNNEL_COLORS.interviewCompleted,
      FUNNEL_COLORS.highScore,
      FUNNEL_COLORS.recommended,
    ];
    const icons = [Users, UserCheck, Calendar, CheckCircle, Award, ThumbsUp];

    return counts.map((count, i) => ({
      label: labels[i],
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: colors[i].bg,
      icon: icons[i],
      dropOff: i > 0 ? counts[i - 1] - count : 0,
      dropOffPct: i > 0 && counts[i - 1] > 0 ? Math.round(((counts[i - 1] - count) / counts[i - 1]) * 100) : 0,
    }));
  }, [candidates]);

  const scatterData = useMemo(() => {
    return candidates.filter((c) => c.score !== null && c.yearsExp > 0);
  }, [candidates]);

  const topCandidates = useMemo(() => {
    return [...candidates]
      .filter((c) => c.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10);
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    switch (activeTab) {
      case "recommended":
        return candidates.filter((c) => c.recommendation === "hire");
      case "consider":
        return candidates.filter((c) => c.recommendation === "consider");
      case "reject":
        return candidates.filter((c) => c.recommendation === "reject");
      case "not-interviewed":
        return candidates.filter((c) => c.recommendation === "pending");
      default:
        return candidates;
    }
  }, [candidates, activeTab]);

  const skillsGap = useMemo(() => {
    const allSkills = candidates.flatMap((c) => c.skills);
    const skillCounts: Record<string, number> = {};
    allSkills.forEach((s) => {
      const lower = s.toLowerCase();
      skillCounts[lower] = (skillCounts[lower] || 0) + 1;
    });

    const sorted = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        candidates: count,
        demand: Math.round(count * 1.3),
      }));

    return sorted;
  }, [candidates]);

  const tabs = [
    { id: "all", label: "All", count: candidates.length },
    { id: "recommended", label: "Recommended", count: candidates.filter((c) => c.recommendation === "hire").length },
    { id: "consider", label: "Consider", count: candidates.filter((c) => c.recommendation === "consider").length },
    { id: "reject", label: "Reject", count: candidates.filter((c) => c.recommendation === "reject").length },
    { id: "not-interviewed", label: "Not Yet Interviewed", count: candidates.filter((c) => c.recommendation === "pending").length },
  ];

  if (loading) return <SkeletonLoading />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Candidate Pipeline</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">Hiring funnel and candidate analytics</p>
        </div>
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-16 text-center">
          <div className="w-12 h-12 bg-[#ef4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
          </div>
          <p className="text-[#a1a1aa] font-medium">{error}</p>
          <p className="text-sm text-[#a1a1aa] mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">Candidate Pipeline</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          Hiring funnel overview and candidate analytics
        </p>
      </div>

      {/* Row 1: Hiring Funnel */}
      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
        <h3 className="text-base font-semibold text-[#fafafa] mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#a78bfa]" />
          Hiring Funnel
        </h3>

        <div className="relative max-w-2xl mx-auto">
          {funnelStages.map((stage, i) => {
            const widthPct = Math.max(20, stage.percentage);
            const Icon = stage.icon;

            return (
              <div key={stage.label} className="relative">
                {i > 0 && stage.dropOff > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-[#ef4444] border border-[#ef4444]/20">
                      <TrendingDown className="w-3 h-3" />
                      -{stage.dropOff} ({stage.dropOffPct}%)
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center mb-3" style={{ paddingLeft: `${(100 - widthPct) / 2}%` }}>
                  <div
                    className={`w-full ${stage.color} rounded-lg px-4 py-3 flex items-center justify-between transition-all duration-500 hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-white/90" />
                      <span className="text-sm font-medium text-white">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">{stage.count}</span>
                      <span className="text-xs text-white/80 bg-[#18181b]/20 px-2 py-0.5 rounded-full">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Score vs Experience Scatter */}
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#a78bfa]" />
            Score vs Experience
          </h3>
          {scatterData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-[#a1a1aa] text-sm">
              No scored candidates with experience data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  type="number"
                  dataKey="yearsExp"
                  name="Experience"
                  unit=" yrs"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  type="number"
                  dataKey="score"
                  name="Score"
                  domain={[0, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={scatterData} fill="#6366f1">
                  {scatterData.map((entry, idx) => {
                    const fill =
                      entry.recommendation === "hire" ? "#22c55e" :
                      entry.recommendation === "consider" ? "#eab308" :
                      entry.recommendation === "reject" ? "#ef4444" : "#94a3b8";
                    return <Cell key={idx} fill={fill} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center justify-center gap-5 mt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-[#a1a1aa]">Hire</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span className="text-xs text-[#a1a1aa]">Consider</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="text-xs text-[#a1a1aa]">Reject</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
              <span className="text-xs text-[#a1a1aa]">Pending</span>
            </div>
          </div>
        </div>

        {/* Right: Top Candidates */}
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Top Candidates
          </h3>
          {topCandidates.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-[#a1a1aa] text-sm">
              No scored candidates yet
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {topCandidates.map((c, i) => {
                const isExpanded = expandedCandidate === c.user.id;
                return (
                  <div key={c.user.id} className="border border-[#27272a] rounded-lg overflow-hidden transition-all duration-200 hover:border-[#27272a]">
                    <button
                      onClick={() => setExpandedCandidate(isExpanded ? null : c.user.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#27272a] transition-colors text-left"
                    >
                      <span className="w-7 h-7 rounded-full bg-indigo-100 text-[#a78bfa] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#fafafa] truncate">
                          {c.user.name || c.user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <ScoreBar score={c.score} />
                        </div>
                      </div>
                      <RecommendationBadge recommendation={c.recommendation} />
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#a1a1aa] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#a1a1aa] flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#27272a] bg-[#18181b]/50 space-y-3 animate-in slide-in-from-top-1">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[#a1a1aa] block mb-1">Profile</span>
                            <ProfileBadge isComplete={c.user.profile?.isComplete === true} />
                          </div>
                          <div>
                            <span className="text-[#a1a1aa] block mb-1">Experience</span>
                            <span className="text-[#a1a1aa] font-medium">{c.user.profile?.totalExperience || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[#a1a1aa] block mb-1">Role</span>
                            <span className="text-[#a1a1aa] font-medium">{c.user.profile?.currentRole || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[#a1a1aa] block mb-1">Location</span>
                            <span className="text-[#a1a1aa] font-medium">{c.user.profile?.currentLocation || "N/A"}</span>
                          </div>
                        </div>
                        {c.skills.length > 0 && (
                          <div>
                            <span className="text-[#a1a1aa] text-xs block mb-1">Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {c.skills.slice(0, 6).map((skill, si) => (
                                <span key={si} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-[#3b82f6] border border-[#3b82f6]/20">
                                  {skill}
                                </span>
                              ))}
                              {c.skills.length > 6 && (
                                <span className="text-[10px] text-[#a1a1aa] self-center">+{c.skills.length - 6} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Candidates by Status */}
      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden">
        <div className="p-4 border-b border-[#27272a]">
          <h3 className="text-base font-semibold text-[#fafafa] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#a78bfa]" />
            Candidates by Status
          </h3>
          <div className="flex items-center gap-1 bg-[#27272a] rounded-lg p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#18181b] text-[#fafafa] shadow-sm"
                    : "text-[#a1a1aa] hover:text-[#a1a1aa]"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-indigo-100 text-[#a78bfa]" : "bg-[#27272a] text-[#a1a1aa]"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181b] border-b border-[#27272a]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a1a1aa]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a1a1aa]">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a1a1aa]">Profile</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a1a1aa]">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a1a1aa]">Recommendation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a1a1aa]">Experience</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a1a1aa]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-[#a1a1aa]">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-[#a1a1aa]" />
                      <p className="text-sm font-medium">No candidates in this category</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.user.id} className="hover:bg-[#27272a] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#fafafa]">{c.user.name || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-[#a1a1aa]">{c.user.email}</td>
                    <td className="px-4 py-3">
                      <ProfileBadge isComplete={c.user.profile?.isComplete === true} />
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={c.score} />
                    </td>
                    <td className="px-4 py-3">
                      <RecommendationBadge recommendation={c.recommendation} />
                    </td>
                    <td className="px-4 py-3 text-[#a1a1aa] text-xs">
                      {c.user.profile?.totalExperience || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedUser(c.user)}
                          className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#a78bfa] hover:bg-[#a78bfa]/10 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {c.user.interview?.status === "completed" && c.user.interview?.videoUrl && (
                          <a
                            href={c.user.interview.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#a855f7] hover:bg-purple-50 transition-colors"
                            title="Watch Interview"
                          >
                            <Play className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Skills Gap Analysis */}
      {skillsGap.length > 0 && (
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#a78bfa]" />
            Skills Gap Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillsGap} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="skill"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="candidates" name="Candidates with Skill" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="demand" name="Estimated Demand" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedUser && (
        <CandidateProfileModal
          key={selectedUser.id}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
