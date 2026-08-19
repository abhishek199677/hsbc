"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
} from "lucide-react";

interface ModelUsage {
  model: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  avgLatency: number;
}

interface EndpointUsage {
  endpoint: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  avgLatency: number;
}

interface DailyUsage {
  date: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  avgLatency: number;
}

interface RecentRequest {
  id: string;
  model: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
  userName: string;
  userEmail: string | null;
  createdAt: string;
}

interface Metrics {
  summary: {
    totalRequests: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCost: number;
    avgLatency: number;
    errorRate: number;
  };
  byModel: ModelUsage[];
  byEndpoint: EndpointUsage[];
  dailyUsage: DailyUsage[];
  recentRequests: RecentRequest[];
}

export default function OpenAIMetrics({ token }: { token: string | null }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [modelFilter, setModelFilter] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ period });
        if (modelFilter) params.set("model", modelFilter);

        const res = await fetch(`/api/admin/openai-metrics?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          return;
        }

        const data = await res.json();
        if (!cancelled && data.success) {
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error("Failed to load OpenAI metrics:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, period, modelFilter]);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    if (cost < 1) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toString();
  };

  const getModelColor = (model: string) => {
    if (model.includes("gpt-5")) return "bg-purple-100 text-purple-700";
    if (model.includes("gpt-3.5")) return "bg-blue-100 text-blue-700";
    if (model.includes("embedding")) return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OpenAI API Metrics</h1>
          <p className="text-sm text-gray-500 mt-1">Track API usage, costs, and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All models</option>
            <option value="gpt-5-nano">GPT-5 Nano</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="text-embedding-3-small">Embeddings</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCost(metrics.summary.totalCost)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            {metrics.summary.totalRequests} total requests
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatTokens(metrics.summary.totalTokens)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formatTokens(metrics.summary.totalPromptTokens)} prompt + {formatTokens(metrics.summary.totalCompletionTokens)} completion
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.summary.avgLatency}ms</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <Activity className="h-3 w-3 inline mr-1" />
            Per request average
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.summary.errorRate}%</p>
            </div>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${metrics.summary.errorRate > 5 ? 'bg-red-100' : 'bg-green-100'}`}>
              {metrics.summary.errorRate > 5 ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.summary.totalRequests > 0 ? Math.round(metrics.summary.totalRequests * metrics.summary.errorRate / 100) : 0} failed requests
          </p>
        </div>
      </div>

      {/* Usage by Model */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage by Model</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.byModel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No API usage data available yet.
                  </td>
                </tr>
              ) : (
                metrics.byModel.map((m) => (
                  <tr key={m.model} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModelColor(m.model)}`}>
                        {m.model}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{m.requests.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTokens(m.promptTokens)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTokens(m.completionTokens)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTokens(m.totalTokens)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCost(m.cost)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{m.avgLatency}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage by Endpoint */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage by Endpoint</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.byEndpoint.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No API usage data available yet.
                  </td>
                </tr>
              ) : (
                metrics.byEndpoint.map((e) => (
                  <tr key={e.endpoint} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{e.endpoint}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{e.requests.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTokens(e.totalTokens)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCost(e.cost)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{e.avgLatency}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Usage Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Usage</h2>
        {metrics.dailyUsage.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No daily usage data available yet.</p>
        ) : (
          <div className="space-y-3">
            {metrics.dailyUsage.map((d) => {
              const maxCost = Math.max(...metrics.dailyUsage.map((x) => x.cost));
              const width = maxCost > 0 ? (d.cost / maxCost) * 100 : 0;
              return (
                <div key={d.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <span className="text-sm font-medium text-gray-900">{formatCost(d.cost)}</span>
                    <span className="text-xs text-gray-500 ml-2">({d.requests} req)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    No recent requests available.
                  </td>
                </tr>
              ) : (
                metrics.recentRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModelColor(r.model)}`}>
                        {r.model}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.endpoint}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTokens(r.totalTokens)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCost(r.cost)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.latencyMs}ms</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <XCircle className="h-5 w-5 text-red-500" />
                          {r.errorMessage && (
                            <span className="text-xs text-red-600 max-w-[150px] truncate" title={r.errorMessage}>
                              {r.errorMessage}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <div>{r.userName}</div>
                      {r.userEmail && <div className="text-xs text-gray-400">{r.userEmail}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
