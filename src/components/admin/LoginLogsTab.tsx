"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Search, CheckCircle, XCircle, Monitor, Smartphone, Tablet } from "lucide-react";

interface LoginLog {
  id: string;
  email: string;
  userName: string;
  userRole: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  createdAt: string;
}

interface LoginMetrics {
  summary: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    successRate: number;
  };
  dailyLogins: {
    date: string;
    total: number;
    successful: number;
    failed: number;
  }[];
  recentLogins: LoginLog[];
  topUsers: {
    email: string;
    loginCount: number;
  }[];
}

export default function LoginLogsTab({ token }: { token: string | null }) {
  const [metrics, setMetrics] = useState<LoginMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [searchEmail, setSearchEmail] = useState("");
  const [filterSuccess, setFilterSuccess] = useState<string>("all");

  const fetchLogs = useCallback(async (email = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (email) params.set("email", email);
      if (filterSuccess !== "all") params.set("success", filterSuccess);

      const res = await fetch(`/api/admin/login-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to fetch login logs:", err);
    } finally {
      setLoading(false);
    }
  }, [filterSuccess, period, token]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ period });
        if (filterSuccess !== "all") params.set("success", filterSuccess);

        const res = await fetch(`/api/admin/login-logs?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to fetch login logs:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [period, filterSuccess, token]);

  const handleSearch = () => {
    void fetchLogs(searchEmail);
  };

  const exportCSV = () => {
    if (!metrics?.recentLogins.length) return;
    const rows = metrics.recentLogins.map((l) => ({
      Email: l.email,
      Name: l.userName,
      Role: l.userRole,
      Success: l.success ? "Yes" : "No",
      "Failure Reason": l.failureReason || "",
      "IP Address": l.ipAddress || "",
      Device: l.device || "",
      Browser: l.browser || "",
      OS: l.os || "",
      Date: new Date(l.createdAt).toLocaleDateString(),
      Time: new Date(l.createdAt).toLocaleTimeString(),
    }));
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = String(r[h as keyof typeof r] ?? "");
            return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `login-logs-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDeviceIcon = (device: string | null) => {
    if (!device) return <Monitor className="h-4 w-4 text-gray-400" />;
    if (device === "Mobile") return <Smartphone className="h-4 w-4 text-blue-500" />;
    if (device === "Tablet") return <Tablet className="h-4 w-4 text-purple-500" />;
    return <Monitor className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Login Logs</h2>
          <p className="text-sm text-gray-500">Track user login activity and authentication attempts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void fetchLogs()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Logins</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.summary.totalLogins}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Successful</p>
                <p className="text-3xl font-bold text-green-600">{metrics.summary.successfulLogins}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-100" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-3xl font-bold text-red-600">{metrics.summary.failedLogins}</p>
              </div>
              <XCircle className="h-12 w-12 text-red-100" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-3xl font-bold text-indigo-600">{metrics.summary.successRate}%</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filterSuccess}
              onChange={(e) => setFilterSuccess(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="true">Successful</option>
              <option value="false">Failed</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Search className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Daily Login Chart */}
      {metrics && metrics.dailyLogins.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Login Activity</h3>
          <div className="space-y-2">
            {metrics.dailyLogins.slice(0, 14).map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24">
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <div className="flex-1 flex items-center gap-1">
                  <div
                    className="h-6 bg-green-400 rounded"
                    style={{ width: `${(day.successful / Math.max(...metrics.dailyLogins.map((d) => d.total), 1)) * 100}%` }}
                  />
                  <div
                    className="h-6 bg-red-400 rounded"
                    style={{ width: `${(day.failed / Math.max(...metrics.dailyLogins.map((d) => d.total), 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-20 text-right">{day.total} total</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded" />
              <span className="text-gray-600">Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded" />
              <span className="text-gray-600">Failed</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Logins Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Login Activity</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : metrics?.recentLogins.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No login logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Browser</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics?.recentLogins.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.userName || "Unknown"}</p>
                        <p className="text-sm text-gray-500">{log.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3" />
                          Failed
                          {log.failureReason && `: ${log.failureReason}`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(log.device)}
                        <span className="text-sm text-gray-900">{log.device || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.browser || "Unknown"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.os || "Unknown"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ipAddress || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Users */}
      {metrics && metrics.topUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
          <div className="space-y-3">
            {metrics.topUsers.map((user) => (
              <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user.email}</span>
                </div>
                <span className="text-sm text-gray-500">{user.loginCount} logins</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
