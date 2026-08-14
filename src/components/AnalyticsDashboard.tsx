"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Award,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded w-8" />
            <div className="flex-1 h-6 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-36 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          setError("Unauthorized");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          if (data.success) setAnalytics(data.analytics);
          else setError("Failed to load analytics");
        }
      } catch {
        if (!cancelled) setError("Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonBar />
          <SkeletonBar />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonList />
          <SkeletonList />
          <SkeletonBar />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          {error}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const maxScoreCount = Math.max(...analytics.scoreDistribution.map((b) => b.count), 1);
  const maxRecommendation = Math.max(
    analytics.recommendationBreakdown.hire,
    analytics.recommendationBreakdown.consider,
    analytics.recommendationBreakdown.reject,
    1
  );

  const monthTrend =
    analytics.interviewsLastMonth > 0
      ? ((analytics.interviewsThisMonth - analytics.interviewsLastMonth) /
          analytics.interviewsLastMonth) *
        100
      : analytics.interviewsThisMonth > 0
      ? 100
      : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Interviews</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalCompleted}</p>
              <div className="flex items-center gap-1 mt-1">
                {monthTrend >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    monthTrend >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {monthTrend >= 0 ? "+" : ""}
                  {Math.round(monthTrend)}% vs last month
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Score</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.avgScore}</p>
              <p className="text-xs text-gray-400 mt-1">out of 10</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.completionRate}%</p>
              <p className="text-xs text-gray-400 mt-1">
                {analytics.totalCompleted} of{" "}
                {analytics.totalCompleted +
                  analytics.recommendationBreakdown.hire +
                  analytics.recommendationBreakdown.consider +
                  analytics.recommendationBreakdown.reject}{" "}
                scheduled
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hire Rate</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.hireRate}%</p>
              <p className="text-xs text-gray-400 mt-1">
                {analytics.recommendationBreakdown.hire} recommended
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution & Most Active Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <div className="space-y-3">
            {analytics.scoreDistribution.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-8">{bucket.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(bucket.count / maxScoreCount) * 100}%`,
                      minWidth: bucket.count > 0 ? "24px" : "0",
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-500 w-8 text-right">
                  {bucket.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Days</h3>
          <div className="space-y-3">
            {analytics.mostActiveDays.map((item) => {
              const maxDay = Math.max(...analytics.mostActiveDays.map((d) => d.count), 1);
              return (
                <div key={item.day} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-8">{item.day}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / maxDay) * 100}%`,
                        minWidth: item.count > 0 ? "24px" : "0",
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-500 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strengths, Weaknesses, Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Strengths */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-500" />
            Top Strengths
          </h3>
          {analytics.topStrengths.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-2">
              {analytics.topStrengths.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-700">{s.name}</span>
                  <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Weaknesses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Top Weaknesses
          </h3>
          {analytics.topWeaknesses.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-2">
              {analytics.topWeaknesses.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-700">{w.name}</span>
                  <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {w.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendation Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  Hire
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {analytics.recommendationBreakdown.hire}
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(analytics.recommendationBreakdown.hire / maxRecommendation) * 100}%`,
                    minWidth: analytics.recommendationBreakdown.hire > 0 ? "16px" : "0",
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-yellow-500" />
                  Consider
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {analytics.recommendationBreakdown.consider}
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (analytics.recommendationBreakdown.consider / maxRecommendation) * 100
                    }%`,
                    minWidth: analytics.recommendationBreakdown.consider > 0 ? "16px" : "0",
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                  Reject
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {analytics.recommendationBreakdown.reject}
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (analytics.recommendationBreakdown.reject / maxRecommendation) * 100
                    }%`,
                    minWidth: analytics.recommendationBreakdown.reject > 0 ? "16px" : "0",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
