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
  registered: { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700", fill: "#3b82f6" },
  profileComplete: { bg: "bg-indigo-500", light: "bg-indigo-100", text: "text-indigo-700", fill: "#6366f1" },
  interviewScheduled: { bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-700", fill: "#a855f7" },
  interviewCompleted: { bg: "bg-green-500", light: "bg-green-100", text: "text-green-700", fill: "#22c55e" },
  highScore: { bg: "bg-emerald-500", light: "bg-emerald-100", text: "text-emerald-700", fill: "#10b981" },
  recommended: { bg: "bg-green-600", light: "bg-green-100", text: "text-green-800", fill: "#16a34a" },
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
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-80" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 bg-gray-200 rounded-lg flex-1" />
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-44 mb-6" />
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-36 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="h-5 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg" />
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
  const recColor = rec === "hire" ? "text-green-600" : rec === "consider" ? "text-yellow-600" : rec === "reject" ? "text-red-600" : "text-gray-500";

  return (
    <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100 max-w-xs">
      <p className="text-sm font-semibold text-gray-900 truncate">{data.user.name || data.user.email}</p>
      <div className="mt-1.5 space-y-0.5">
        <p className="text-xs text-gray-500">
          Score: <span className="font-medium text-gray-700">{data.score ?? "N/A"}</span>
        </p>
        <p className="text-xs text-gray-500">
          Experience: <span className="font-medium text-gray-700">{data.yearsExp} yrs</span>
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
    return <span className="text-xs text-gray-400">N/A</span>;
  }
  const pct = Math.min((score / max) * 100, 100);
  const color = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const styles: Record<string, string> = {
    hire: "bg-green-100 text-green-700 border-green-200",
    consider: "bg-yellow-100 text-yellow-700 border-yellow-200",
    reject: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-gray-100 text-gray-500 border-gray-200",
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
      <CheckCircle className="w-3 h-3" />
      Complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
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
        const res = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

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
          <h1 className="text-2xl font-bold text-gray-900">Candidate Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Hiring funnel and candidate analytics</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-600 font-medium">{error}</p>
          <p className="text-sm text-gray-400 mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidate Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hiring funnel overview and candidate analytics
        </p>
      </div>

      {/* Row 1: Hiring Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100">
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
                      <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            Score vs Experience
          </h3>
          {scatterData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No scored candidates with experience data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Hire</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-xs text-gray-600">Consider</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">Reject</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs text-gray-600">Pending</span>
            </div>
          </div>
        </div>

        {/* Right: Top Candidates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Top Candidates
          </h3>
          {topCandidates.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No scored candidates yet
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {topCandidates.map((c, i) => {
                const isExpanded = expandedCandidate === c.user.id;
                return (
                  <div key={c.user.id} className="border border-gray-100 rounded-lg overflow-hidden transition-all duration-200 hover:border-gray-200">
                    <button
                      onClick={() => setExpandedCandidate(isExpanded ? null : c.user.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {c.user.name || c.user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <ScoreBar score={c.score} />
                        </div>
                      </div>
                      <RecommendationBadge recommendation={c.recommendation} />
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50/50 space-y-3 animate-in slide-in-from-top-1">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500 block mb-1">Profile</span>
                            <ProfileBadge isComplete={c.user.profile?.isComplete === true} />
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Experience</span>
                            <span className="text-gray-700 font-medium">{c.user.profile?.totalExperience || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Role</span>
                            <span className="text-gray-700 font-medium">{c.user.profile?.currentRole || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Location</span>
                            <span className="text-gray-700 font-medium">{c.user.profile?.currentLocation || "N/A"}</span>
                          </div>
                        </div>
                        {c.skills.length > 0 && (
                          <div>
                            <span className="text-gray-500 text-xs block mb-1">Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {c.skills.slice(0, 6).map((skill, si) => (
                                <span key={si} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  {skill}
                                </span>
                              ))}
                              {c.skills.length > 6 && (
                                <span className="text-[10px] text-gray-400 self-center">+{c.skills.length - 6} more</span>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Candidates by Status
          </h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"
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
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Profile</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recommendation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Experience</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-gray-300" />
                      <p className="text-sm font-medium">No candidates in this category</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{c.user.name || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.user.email}</td>
                    <td className="px-4 py-3">
                      <ProfileBadge isComplete={c.user.profile?.isComplete === true} />
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={c.score} />
                    </td>
                    <td className="px-4 py-3">
                      <RecommendationBadge recommendation={c.recommendation} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {c.user.profile?.totalExperience || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedUser(c.user)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {c.user.interview?.status === "completed" && c.user.interview?.videoUrl && (
                          <a
                            href={c.user.interview.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            Skills Gap Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillsGap} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
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
