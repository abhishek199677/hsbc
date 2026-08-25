"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  ClipboardList,
  Users,
  Code,
  Calendar,
  ThumbsUp,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface VirtusaDashboardProps {
  token: string | null;
}

interface DashboardStats {
  totalUsers: number;
  totalInterviews: number;
  completedInterviews: number;
  scheduledInterviews: number;
  totalProfiles: number;
  completedProfiles: number;
  pipeline: {
    new: number;
    review: number;
    hrInterview: number;
    technicalInterview: number;
    interviews: number;
    offer: number;
    hires: number;
  };
  scoreDistribution: { label: string; count: number }[];
  recommendationBreakdown: { label: string; value: number; color: string }[];
  topLocations: { name: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

const PIPELINE_COLORS = [
  "#2563eb",
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#22c55e",
  "#f97316",
];

function StatCard({
  label,
  value,
  total,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ElementType;
  color: string;
}) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 mt-1">{pct}% of total</span>
      <span className="text-xs font-medium text-gray-700 mt-0.5">{label}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-2" />
      <div className="h-7 bg-gray-200 rounded w-12 mx-auto mb-1" />
      <div className="h-3 bg-gray-100 rounded w-16 mx-auto" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-40 mb-6" />
      <div className="h-56 bg-gray-100 rounded-lg" />
    </div>
  );
}

export default function VirtusaDashboard({ token }: VirtusaDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("");

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, analyticsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const statsData = await statsRes.json();
      const analyticsData = await analyticsRes.json();
      const usersData = await usersRes.json();

      const users = usersData.users || [];

      const pipeline = {
        new: users.filter((u: Record<string, unknown>) => {
          const p = u.profile as { isComplete?: boolean } | undefined;
          return !u.interview && p?.isComplete;
        }).length,
        review: users.filter((u: Record<string, unknown>) => {
          const i = u.interview as { status?: string } | undefined;
          return i?.status === "scheduled";
        }).length,
        hrInterview: users.filter((u: Record<string, unknown>) => {
          const i = u.interview as { status?: string } | undefined;
          return i?.status === "in_progress";
        }).length,
        technicalInterview: 0,
        interviews: users.filter((u: Record<string, unknown>) => {
          const i = u.interview as { status?: string } | undefined;
          return i?.status === "completed";
        }).length,
        offer: users.filter((u: Record<string, unknown>) => {
          const i = u.interview as { evaluationScore?: number | null } | undefined;
          return i?.evaluationScore != null && i.evaluationScore >= 7;
        }).length,
        hires: users.filter((u: Record<string, unknown>) => {
          const i = u.interview as { evaluationScore?: number | null } | undefined;
          return i?.evaluationScore != null && i.evaluationScore >= 8;
        }).length,
      };

      const locations: Record<string, number> = {};
      users.forEach((u: Record<string, unknown>) => {
        const loc = (u as { profile?: { currentLocation?: string } }).profile?.currentLocation;
        if (loc) {
          locations[loc] = (locations[loc] || 0) + 1;
        }
      });

      const topLocations = Object.entries(locations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalInterviews: statsData.totalInterviews || 0,
        completedInterviews: statsData.completedInterviews || 0,
        scheduledInterviews: statsData.scheduledInterviews || 0,
        totalProfiles: statsData.totalProfiles || 0,
        completedProfiles: statsData.completedProfiles || 0,
        pipeline,
        scoreDistribution: analyticsData.scoreDistribution || [],
        recommendationBreakdown: [
          { label: "Hire", value: analyticsData.recommendationBreakdown?.hire || 0, color: "#22c55e" },
          { label: "Consider", value: analyticsData.recommendationBreakdown?.consider || 0, color: "#f59e0b" },
          { label: "Reject", value: analyticsData.recommendationBreakdown?.reject || 0, color: "#ef4444" },
        ],
        topLocations,
        recentActivity: analyticsData.mostActiveDays || [],
      });

      setLastRefresh(new Date().toLocaleString());
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const total = stats
    ? Object.values(stats.pipeline).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of all jobs, suppliers and hiring pipeline
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            Last Refresh: {lastRefresh || "Loading..."}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <StatCard label="New" value={stats.pipeline.new} total={total} icon={UserPlus} color="#2563eb" />
          <StatCard label="Review" value={stats.pipeline.review} total={total} icon={ClipboardList} color="#f59e0b" />
          <StatCard label="HR Interview" value={stats.pipeline.hrInterview} total={total} icon={Users} color="#3b82f6" />
          <StatCard label="Technical" value={stats.pipeline.technicalInterview} total={total} icon={Code} color="#10b981" />
          <StatCard label="Interviews" value={stats.pipeline.interviews} total={total} icon={Calendar} color="#8b5cf6" />
          <StatCard label="Offer" value={stats.pipeline.offer} total={total} icon={ThumbsUp} color="#22c55e" />
          <StatCard label="Hires" value={stats.pipeline.hires} total={total} icon={CheckCircle} color="#f97316" />
        </div>
      ) : null}

      {/* Charts Row 1 */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonChart key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stage Funnel */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Stage Funnel</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={[
                    { name: "New", value: stats.pipeline.new },
                    { name: "Review", value: stats.pipeline.review },
                    { name: "HR Interview", value: stats.pipeline.hrInterview },
                    { name: "Technical", value: stats.pipeline.technicalInterview },
                    { name: "Interviews", value: stats.pipeline.interviews },
                    { name: "Offer", value: stats.pipeline.offer },
                    { name: "Hires", value: stats.pipeline.hires },
                  ].filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {PIPELINE_COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {["New", "Review", "HR Interview", "Technical", "Interviews", "Offer", "Hires"].map(
                (label, i) => (
                  <span key={label} className="flex items-center gap-1 text-[11px] text-gray-600">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIPELINE_COLORS[i] }} />
                    {label}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Submission Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Submission Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#d1d5db" />
                <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendation Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recommendation Distribution</h3>
            {stats.recommendationBreakdown.some((r) => r.value > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats.recommendationBreakdown.filter((r) => r.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.recommendationBreakdown
                      .filter((r) => r.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">
                No Data Available
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {stats.recommendationBreakdown.map((item) => (
                <span key={item.label} className="flex items-center gap-1 text-[11px] text-gray-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label} ({item.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Charts Row 2 */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#d1d5db" />
                <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Jobs */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Top 5 Job Roles</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={stats.topLocations.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#d1d5db" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#d1d5db" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Locations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Top 5 Locations</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={stats.topLocations.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#d1d5db" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#d1d5db" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-4">
        © {new Date().getFullYear()} HireRight. All rights reserved.
      </div>
    </div>
  );
}
