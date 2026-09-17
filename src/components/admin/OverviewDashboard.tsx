"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  BarChart3,
  Award,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  AlertTriangle,
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
  Area,
  AreaChart,
} from "recharts";

interface OverviewDashboardProps {
  token: string | null;
}

interface Stats {
  totalUsers: number;
  totalProfiles: number;
  completedProfiles: number;
  totalInterviews: number;
  completedInterviews: number;
  scheduledInterviews: number;
}

interface Analytics {
  interviewsThisMonth: number;
  interviewsLastMonth: number;
  avgScore: number;
  completionRate: number;
  hireRate: number;
  mostActiveDays: { day: string; count: number }[];
  scoreDistribution: { label: string; count: number }[];
  topStrengths: { name: string; count: number }[];
  topWeaknesses: { name: string; count: number }[];
  recommendationBreakdown: { hire: number; consider: number; reject: number };
  totalCompleted: number;
}

const COLORS = {
  blue: "#3b82f6",
  green: "#22c55e",
  indigo: "#6366f1",
  purple: "#a855f7",
  red: "#ef4444",
  yellow: "#eab308",
  amber: "#f59e0b",
};

function SkeletonCard() {
  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-3.5 bg-[#27272a] rounded w-24" />
          <div className="h-8 bg-[#27272a] rounded w-20" />
          <div className="h-3 bg-[#27272a] rounded w-28" />
        </div>
        <div className="w-12 h-12 bg-[#27272a] rounded-xl ml-4" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
      <div className="h-5 bg-[#27272a] rounded w-44 mb-6" />
      <div className="h-56 bg-[#27272a] rounded-lg" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 animate-pulse">
      <div className="h-5 bg-[#27272a] rounded w-36 mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 bg-[#27272a] rounded w-32" />
            <div className="h-5 bg-[#27272a] rounded-full w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-[#27272a] rounded w-48 mb-2" />
        <div className="h-4 bg-[#27272a] rounded w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonList />
        <SkeletonList />
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] px-4 py-3 rounded-lg shadow-lg border border-[#27272a]">
      <p className="text-xs font-medium text-[#a1a1aa] mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#a1a1aa]">{entry.name}:</span>
          <span className="font-semibold text-[#fafafa]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}) {
  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#a1a1aa]">{label}</p>
          <p className="text-3xl font-bold text-[#fafafa] tracking-tight">{value}</p>
          {(trend || trendLabel) && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />}
              {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-[#ef4444]" />}
              {trendLabel && (
                <span
                  className={`text-xs font-medium ${
                    trend === "up"
                      ? "text-[#22c55e]"
                      : trend === "down"
                      ? "text-[#ef4444]"
                      : "text-[#a1a1aa]"
                  }`}
                >
                  {trendLabel}
                </span>
              )}
            </div>
          )}
          {subtitle && !trendLabel && (
            <p className="text-xs text-[#a1a1aa] mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function OverviewDashboard({ token }: OverviewDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/analytics"),
        ]);

        if (statsRes.status === 401 || statsRes.status === 403) {
          if (!cancelled) setError("Unauthorized. Please log in again.");
          return;
        }
        if (analyticsRes.status === 401 || analyticsRes.status === 403) {
          if (!cancelled) setError("Unauthorized. Please log in again.");
          return;
        }

        const [statsData, analyticsData] = await Promise.all([
          statsRes.json(),
          analyticsRes.json(),
        ]);

        if (!cancelled) {
          if (statsData.success) setStats(statsData.stats);
          else setError("Failed to load stats");

          if (analyticsData.success) setAnalytics(analyticsData.analytics);
          else setError("Failed to load analytics");
        }
      } catch {
        if (!cancelled) setError("Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <SkeletonLoading />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Overview</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            Dashboard summary and analytics
          </p>
        </div>
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-16 text-center">
          <div className="w-12 h-12 bg-[#ef4444]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
          </div>
          <p className="text-[#a1a1aa] font-medium">{error}</p>
          <p className="text-sm text-[#a1a1aa] mt-1">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  if (!stats || !analytics) return null;

  const monthTrend =
    analytics.interviewsLastMonth > 0
      ? ((analytics.interviewsThisMonth - analytics.interviewsLastMonth) /
          analytics.interviewsLastMonth) *
        100
      : analytics.interviewsThisMonth > 0
      ? 100
      : 0;

  const interviewPipelineData = [
    {
      name: "Scheduled",
      count: stats.scheduledInterviews,
    },
    {
      name: "Completed",
      count: stats.completedInterviews,
    },
    {
      name: "Cancelled",
      count: Math.max(
        0,
        stats.totalInterviews - stats.completedInterviews - stats.scheduledInterviews
      ),
    },
  ];

  const recommendationData = [
    {
      name: "Hire",
      value: analytics.recommendationBreakdown.hire,
      color: COLORS.green,
    },
    {
      name: "Consider",
      value: analytics.recommendationBreakdown.consider,
      color: COLORS.yellow,
    },
    {
      name: "Reject",
      value: analytics.recommendationBreakdown.reject,
      color: COLORS.red,
    },
  ];

  const activityData = analytics.mostActiveDays.map((d) => ({
    day: d.day,
    count: d.count,
  }));

  const totalRecommendations =
    analytics.recommendationBreakdown.hire +
    analytics.recommendationBreakdown.consider +
    analytics.recommendationBreakdown.reject;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">Overview</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          Dashboard summary and analytics
        </p>
      </div>

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-[#3b82f6]"
          trend={stats.totalUsers > 0 ? "up" : "neutral"}
          trendLabel={`${stats.totalProfiles} profiles`}
        />
        <MetricCard
          label="Interviews Completed"
          value={analytics.totalCompleted}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-[#22c55e]"
          trend={monthTrend >= 0 ? "up" : "down"}
          trendLabel={`${monthTrend >= 0 ? "+" : ""}${Math.round(monthTrend)}% vs last month`}
        />
        <MetricCard
          label="Avg Score"
          value={analytics.avgScore}
          subtitle="out of 10"
          icon={BarChart3}
          iconBg="bg-[#a78bfa]/10"
          iconColor="text-[#a78bfa]"
        />
        <MetricCard
          label="Hire Rate"
          value={`${analytics.hireRate}%`}
          icon={Award}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          subtitle={`${analytics.recommendationBreakdown.hire} recommended`}
        />
      </div>

      {/* Row 2: Interview Pipeline & Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5">
            Interview Pipeline
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={interviewPipelineData} barSize={40}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#18181b" }} />
              <Bar
                dataKey="count"
                name="Interviews"
                radius={[6, 6, 0, 0]}
                fill={COLORS.blue}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5">
            Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.scoreDistribution} barSize={40}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={1} />
                  <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#18181b" }} />
              <Bar
                dataKey="count"
                name="Candidates"
                radius={[6, 6, 0, 0]}
                fill="url(#scoreGradient)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Hiring Recommendations & Interview Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5">
            Hiring Recommendations
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={recommendationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {recommendationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0];
                    const pct =
                      totalRecommendations > 0
                        ? Math.round(
                            ((data.value as number) / totalRecommendations) * 100
                          )
                        : 0;
                    return (
                      <div className="bg-[#18181b] px-4 py-3 rounded-lg shadow-lg border border-[#27272a]">
                        <p className="text-sm font-semibold text-[#fafafa]">
                          {data.name}
                        </p>
                        <p className="text-xs text-[#a1a1aa] mt-0.5">
                          {data.value} candidates ({pct}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            {recommendationData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-[#a1a1aa]">
                  {entry.name}{" "}
                  <span className="font-medium text-[#fafafa]">{entry.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5">
            Interview Activity
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Interviews"
                stroke={COLORS.indigo}
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                dot={{
                  r: 4,
                  fill: COLORS.indigo,
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5 flex items-center gap-2">
            <ThumbsUp className="w-4.5 h-4.5 text-[#22c55e]" />
            Top Strengths
          </h3>
          {analytics.topStrengths.length === 0 ? (
            <p className="text-sm text-[#a1a1aa]">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {analytics.topStrengths.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-sm text-[#a1a1aa]">{s.name}</span>
                  <span className="text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e] px-2.5 py-1 rounded-full">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
          <h3 className="text-base font-semibold text-[#fafafa] mb-5 flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            Top Weaknesses
          </h3>
          {analytics.topWeaknesses.length === 0 ? (
            <p className="text-sm text-[#a1a1aa]">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {analytics.topWeaknesses.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-sm text-[#a1a1aa]">{w.name}</span>
                  <span className="text-xs font-semibold bg-[#f59e0b]/10 text-[#f59e0b] px-2.5 py-1 rounded-full">
                    {w.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
