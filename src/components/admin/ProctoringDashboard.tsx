"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  User,
  ChevronRight,
  X,
  AlertOctagon,
  EyeOff,
  Users,
  Activity,
} from "lucide-react";

interface ProctoringIncident {
  type: string;
  timestamp: number;
  duration: number;
}

interface ProctoringReport {
  enabled: boolean;
  durationMs: number;
  incidents: ProctoringIncident[];
  lookAwayCount: number;
  faceHiddenCount: number;
  multipleFacesCount: number;
  eyesClosedCount: number;
  totalLookAwayMs: number;
  result: "pass" | "review" | "fail" | "off";
}

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  scheduledAt: string;
  status: string;
  proctoringStatus?: string;
  proctoringFlags?: string[];
  proctoringReport?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  interviews?: Interview[];
}

interface ProctoringDashboardProps {
  token: string | null;
}

interface FlaggedInterview {
  interview: Interview;
  report: ProctoringReport;
}

interface TimelineEntry {
  interviewId: string;
  candidateName: string;
  incident: ProctoringIncident;
  date: Date;
}

const INCIDENT_COLORS: Record<string, string> = {
  look_away: "#f59e0b",
  face_hidden: "#ef4444",
  multiple_faces: "#dc2626",
  eyes_closed: "#f97316",
  tab_switch: "#8b5cf6",
  copy_paste: "#ec4899",
  window_blur: "#a855f7",
};

function getIncidentSeverity(type: string): string {
  switch (type) {
    case "look_away":
      return "low";
    case "eyes_closed":
      return "low";
    case "face_hidden":
      return "medium";
    case "multiple_faces":
      return "high";
    case "tab_switch":
      return "medium";
    case "copy_paste":
      return "high";
    case "window_blur":
      return "medium";
    default:
      return "medium";
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getIncidentLabel(type: string): string {
  const labels: Record<string, string> = {
    look_away: "Look Away",
    face_hidden: "Face Hidden",
    multiple_faces: "Multiple Faces",
    eyes_closed: "Eyes Closed",
    tab_switch: "Tab Switch",
    copy_paste: "Copy/Paste",
    window_blur: "Window Blur",
  };
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SkeletonCard() {
  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#27272a] rounded-xl" />
        <div className="flex-1">
          <div className="h-4 bg-[#27272a] rounded w-24 mb-2" />
          <div className="h-8 bg-[#27272a] rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
      <div className="h-6 bg-[#27272a] rounded w-40 mb-6" />
      <div className="h-64 bg-[#27272a] rounded" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
      <div className="h-6 bg-[#27272a] rounded w-48 mb-6" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-[#27272a] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function ProctoringDashboard({ token }: ProctoringDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<FlaggedInterview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      if (!token) {
        setError("Authentication token is required");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/admin/users");

        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.statusText}`);
        }

        const data = await res.json();
        setUsers(data.users || data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load proctoring data");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [token]);

  const allInterviews = useMemo(() => {
    const interviews: Interview[] = [];
    for (const user of users) {
      if (user.interviews) {
        for (const interview of user.interviews) {
          interviews.push({ ...interview, candidateName: interview.candidateName || user.name, candidateEmail: interview.candidateEmail || user.email });
        }
      }
    }
    return interviews;
  }, [users]);

  const parsedReports = useMemo(() => {
    const map = new Map<string, ProctoringReport>();
    for (const interview of allInterviews) {
      if (interview.proctoringReport) {
        try {
          const parsed = typeof interview.proctoringReport === "string" ? JSON.parse(interview.proctoringReport) : interview.proctoringReport;
          map.set(interview.id, parsed as ProctoringReport);
        } catch {
          // skip invalid JSON
        }
      }
    }
    return map;
  }, [allInterviews]);

  const stats = useMemo(() => {
    let totalMonitored = 0;
    let passCount = 0;
    let reviewCount = 0;
    let failCount = 0;
    let offCount = 0;

    for (const [, report] of parsedReports) {
      if (!report.enabled && report.result === "off") {
        offCount++;
        continue;
      }
      totalMonitored++;
      switch (report.result) {
        case "pass":
          passCount++;
          break;
        case "review":
          reviewCount++;
          break;
        case "fail":
          failCount++;
          break;
        default:
          break;
      }
    }

    return {
      totalMonitored,
      passCount,
      reviewCount,
      failCount,
      offCount,
      passPercent: totalMonitored > 0 ? Math.round((passCount / totalMonitored) * 100) : 0,
      reviewPercent: totalMonitored > 0 ? Math.round((reviewCount / totalMonitored) * 100) : 0,
      failPercent: totalMonitored > 0 ? Math.round((failCount / totalMonitored) * 100) : 0,
    };
  }, [parsedReports]);

  const pieData = useMemo(() => [
    { name: "Pass", value: stats.passCount, color: "#22c55e" },
    { name: "Review", value: stats.reviewCount, color: "#f59e0b" },
    { name: "Fail", value: stats.failCount, color: "#ef4444" },
    { name: "Off", value: stats.offCount, color: "#9ca3af" },
  ], [stats]);

  const violationData = useMemo(() => {
    let lookAway = 0;
    let faceHidden = 0;
    let multipleFaces = 0;
    let eyesClosed = 0;

    for (const [, report] of parsedReports) {
      lookAway += report.lookAwayCount || 0;
      faceHidden += report.faceHiddenCount || 0;
      multipleFaces += report.multipleFacesCount || 0;
      eyesClosed += report.eyesClosedCount || 0;
    }

    return [
      { name: "Look Away", value: lookAway, color: "#f59e0b" },
      { name: "Face Hidden", value: faceHidden, color: "#ef4444" },
      { name: "Multiple Faces", value: multipleFaces, color: "#dc2626" },
      { name: "Eyes Closed", value: eyesClosed, color: "#f97316" },
    ];
  }, [parsedReports]);

  const flaggedSessions = useMemo(() => {
    const flagged: FlaggedInterview[] = [];
    for (const interview of allInterviews) {
      const status = interview.proctoringStatus?.toLowerCase();
      if (status === "review" || status === "fail") {
        const report = parsedReports.get(interview.id);
        if (report) {
          flagged.push({ interview, report });
        }
      }
    }
    return flagged.sort((a, b) => {
      if (a.report.result === "fail" && b.report.result !== "fail") return -1;
      if (a.report.result !== "fail" && b.report.result === "fail") return 1;
      return 0;
    });
  }, [allInterviews, parsedReports]);

  const recentIncidents = useMemo(() => {
    const entries: TimelineEntry[] = [];
    for (const interview of allInterviews) {
      const report = parsedReports.get(interview.id);
      if (report?.incidents) {
        for (const incident of report.incidents) {
          entries.push({
            interviewId: interview.id,
            candidateName: interview.candidateName,
            incident,
            date: new Date(incident.timestamp),
          });
        }
      }
    }
    return entries
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20);
  }, [allInterviews, parsedReports]);

  const openModal = (item: FlaggedInterview) => {
    setSelectedInterview(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedInterview(null);
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-[#27272a] rounded w-80 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonTable />
        <SkeletonTable />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-12 text-center text-[#a1a1aa]">
          <AlertOctagon className="w-16 h-16 text-[#ef4444] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">Unable to Load Dashboard</h2>
          <p className="text-[#a1a1aa]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa] flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#3b82f6]" />
          Proctoring Integrity Dashboard
        </h1>
        <p className="text-[#a1a1aa] mt-1">Monitor interview integrity and proctoring violations</p>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#a1a1aa]">Total Monitored</p>
                <p className="text-3xl font-bold text-[#fafafa]">{stats.totalMonitored}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#22c55e]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#a1a1aa]">Clean Pass</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-[#fafafa]">{stats.passCount}</p>
                  <span className="text-sm text-[#22c55e] font-medium">{stats.passPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#a1a1aa]">Needs Review</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-[#fafafa]">{stats.reviewCount}</p>
                  <span className="text-sm text-[#f59e0b] font-medium">{stats.reviewPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-[#ef4444]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#a1a1aa]">Failed</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-[#fafafa]">{stats.failCount}</p>
                  <span className="text-sm text-[#ef4444] font-medium">{stats.failPercent}%</span>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Integrity Distribution Pie Chart */}
          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
            <h2 className="text-lg font-semibold text-[#fafafa] mb-6">Integrity Distribution</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)",
                    }}
                    formatter={(value) => [value, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-[#a1a1aa]">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Violation Types Bar Chart */}
          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
            <h2 className="text-lg font-semibold text-[#fafafa] mb-6">Violation Types</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={violationData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)",
                    }}
                    formatter={(value) => [value, "Count"]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                    {violationData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* Row 3: Flagged Sessions Table */}
      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden">
          <div className="p-6 border-b border-[#27272a]">
            <h2 className="text-lg font-semibold text-[#fafafa] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
              Flagged Sessions
            </h2>
          </div>
          {flaggedSessions.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-[#22c55e] mx-auto mb-3" />
              <p className="text-[#a1a1aa]">No flagged sessions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#18181b]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">Candidate</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">Incidents</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa]">Look Away Time</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {flaggedSessions.map((item) => (
                    <tr key={item.interview.id} className="hover:bg-[#27272a] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#27272a] rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-[#a1a1aa]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#fafafa] text-sm">{item.interview.candidateName}</p>
                            <p className="text-xs text-[#a1a1aa]">{item.interview.candidateEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a1a1aa]">{formatDate(item.interview.scheduledAt)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.report.result === "fail"
                              ? "bg-[#ef4444]/10 text-[#ef4444]"
                              : "bg-[#f59e0b]/10 text-[#f59e0b]"
                          }`}
                        >
                          {item.report.result === "fail" ? "Failed" : "Review"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                        {item.report.incidents?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                        {formatDuration(item.report.totalLookAwayMs || 0)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openModal(item)}
                          className="inline-flex items-center gap-1.5 text-sm text-[#3b82f6] hover:text-blue-800 font-medium transition-colors"
                        >
                          View Report
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Row 4: Recent Incidents Timeline */}
      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h2 className="text-lg font-semibold text-[#fafafa] mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Recent Incidents Timeline
          </h2>
          {recentIncidents.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-[#a1a1aa] mx-auto mb-2" />
              <p className="text-[#a1a1aa]">No recent incidents</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {recentIncidents.map((entry, idx) => {
                const severity = getIncidentSeverity(entry.incident.type);
                const color = INCIDENT_COLORS[entry.incident.type] || "#6b7280";
                const borderColor =
                  severity === "high"
                    ? "border-l-red-500"
                    : severity === "medium"
                    ? "border-l-yellow-500"
                    : "border-l-green-500";

                return (
                  <div
                    key={`${entry.interviewId}-${idx}`}
                    className={`flex items-start gap-4 p-4 rounded-lg border-l-4 bg-[#18181b] hover:bg-[#27272a] transition-colors ${borderColor}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      {entry.incident.type === "look_away" && <Eye className="w-4 h-4" style={{ color }} />}
                      {entry.incident.type === "face_hidden" && <EyeOff className="w-4 h-4" style={{ color }} />}
                      {entry.incident.type === "multiple_faces" && <Users className="w-4 h-4" style={{ color }} />}
                      {entry.incident.type === "eyes_closed" && <Eye className="w-4 h-4" style={{ color }} />}
                      {!["look_away", "face_hidden", "multiple_faces", "eyes_closed"].includes(entry.incident.type) && (
                        <AlertTriangle className="w-4 h-4" style={{ color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#fafafa] text-sm">{entry.candidateName}</span>
                        <span className="text-[#a1a1aa]">&middot;</span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {getIncidentLabel(entry.incident.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#a1a1aa]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(entry.incident.timestamp)}
                        </span>
                        <span>Duration: {formatDuration(entry.incident.duration)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Modal */}
      {modalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
              <div>
                <h3 className="text-lg font-semibold text-[#fafafa]">Proctoring Report</h3>
                <p className="text-sm text-[#a1a1aa]">{selectedInterview.interview.candidateName}</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#27272a] transition-colors"
              >
                <X className="w-5 h-5 text-[#a1a1aa]" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Duration */}
              <div className="bg-[#18181b] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#a1a1aa]" />
                  <span className="text-sm font-medium text-[#a1a1aa]">Interview Duration</span>
                </div>
                <p className="text-2xl font-bold text-[#fafafa]">
                  {formatDuration(selectedInterview.report.durationMs)}
                </p>
              </div>

              {/* Incident Counts */}
              <div>
                <h4 className="text-sm font-semibold text-[#a1a1aa] mb-3">Incident Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Look Away", count: selectedInterview.report.lookAwayCount, icon: Eye, color: "#f59e0b" },
                    { label: "Face Hidden", count: selectedInterview.report.faceHiddenCount, icon: EyeOff, color: "#ef4444" },
                    { label: "Multiple Faces", count: selectedInterview.report.multipleFacesCount, icon: Users, color: "#dc2626" },
                    { label: "Eyes Closed", count: selectedInterview.report.eyesClosedCount, icon: Eye, color: "#f97316" },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="text-xs text-[#a1a1aa]">{item.label}</p>
                        <p className="text-lg font-bold text-[#fafafa]">{item.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div>
                <h4 className="text-sm font-semibold text-[#a1a1aa] mb-3">Risk Assessment</h4>
                <div className={`rounded-xl p-4 ${
                  selectedInterview.report.result === "fail"
                    ? "bg-red-50 border border-[#ef4444]/30"
                    : "bg-yellow-50 border border-[#f59e0b]/30"
                }`}>
                  <div className="flex items-center gap-3">
                    {selectedInterview.report.result === "fail" ? (
                      <XCircle className="w-8 h-8 text-[#ef4444] flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-[#f59e0b] flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        selectedInterview.report.result === "fail" ? "text-[#ef4444]" : "text-[#f59e0b]"
                      }`}>
                        {selectedInterview.report.result === "fail" ? "High Risk - Failed" : "Medium Risk - Needs Review"}
                      </p>
                      <p className={`text-sm mt-0.5 ${
                        selectedInterview.report.result === "fail" ? "text-[#ef4444]" : "text-[#f59e0b]"
                      }`}>
                        {selectedInterview.report.incidents?.length || 0} total incidents detected during the interview session
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {selectedInterview.report.incidents && selectedInterview.report.incidents.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#a1a1aa] mb-3">Incident Timeline</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedInterview.report.incidents.map((incident, idx) => {
                      const color = INCIDENT_COLORS[incident.type] || "#6b7280";
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-[#18181b] rounded-lg"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-[#fafafa] flex-1">
                            {getIncidentLabel(incident.type)}
                          </span>
                          <span className="text-xs text-[#a1a1aa]">
                            {formatTimestamp(incident.timestamp)}
                          </span>
                          <span className="text-xs text-[#a1a1aa]">
                            {formatDuration(incident.duration)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#27272a] p-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-[#27272a] hover:bg-[#27272a] text-[#a1a1aa] rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
