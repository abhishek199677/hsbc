"use client";

import { useState, useEffect } from "react";
import { Users, Calendar, FileText, TrendingUp, ArrowRight, CheckCircle, Clock, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { buildPlaybackUrl } from "@/lib/uploadFile";

interface Stats {
  totalUsers: number;
  totalInterviews: number;
  completedInterviews: number;
  scheduledInterviews: number;
  totalProfiles: number;
  completedProfiles: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  profile?: {
    isComplete: boolean;
    currentRole: string | null;
    totalExperience: string | null;
  };
  interview?: {
    date: string;
    time: string;
    status: string;
    videoUrl: string | null;
    captionUrl: string | null;
    evaluationScore: number | null;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { token, user, organization, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "interviews">("overview");

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "admin" && user.role !== "employer"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (statsRes.status === 401 || statsRes.status === 403 || usersRes.status === 401 || usersRes.status === 403) {
          router.push("/login");
          return;
        }
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        if (cancelled) return;
        if (statsData.success) setStats(statsData.stats);
        if (usersData.success) setUsers(usersData.users);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center">
                <img src={organization?.logoUrl || "/logo.jpeg"} alt={organization?.name || "Techcitta"} className="h-10 w-auto" />
              </Link>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {organization?.name || "Admin"} Admin
              </span>
            </div>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {([
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "users", label: "Users", icon: Users },
            { id: "interviews", label: "Interviews", icon: Calendar },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Interviews Scheduled</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalInterviews}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Completed Profiles</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.completedProfiles}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview Stats */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.completedInterviews}</p>
                        <p className="text-sm text-gray-500">Completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                      <Clock className="w-8 h-8 text-yellow-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.scheduledInterviews}</p>
                        <p className="text-sm text-gray-500">Scheduled</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Failed to load stats</p>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profile Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interview</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.name || "N/A"}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.profile?.currentRole || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.profile?.totalExperience || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.profile?.isComplete
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {user.profile?.isComplete ? "Complete" : "In Progress"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.interview ? (
                            <div className="text-sm">
                              <p className="text-gray-900">{user.interview.date}</p>
                              <p className="text-gray-500">{user.interview.time}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not scheduled</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    No users registered yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === "interviews" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Interview Management</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.filter(u => u.interview).map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.name || "N/A"}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.interview?.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.interview?.time}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          AI Video
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.interview?.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : user.interview?.status === "scheduled"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {user.interview?.status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {user.interview?.status === "completed" && user.interview?.videoUrl ? (
                              <details className="group">
                                <summary className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1 cursor-pointer list-none">
                                  <Video className="w-4 h-4" />
                                  View Recording
                                </summary>
                                <div className="mt-2 w-80">
                                  <video
                                    src={buildPlaybackUrl(user.interview.videoUrl, token)}
                                    controls
                                    className="w-full rounded-lg bg-gray-900"
                                  >
                                    {user.interview?.captionUrl && (
                                      <track kind="captions" src={buildPlaybackUrl(user.interview.captionUrl, token)} srcLang="en" label="Simple English" default />
                                    )}
                                  </video>
                                </div>
                              </details>
                            ) : (
                              <Link
                                href={`/interview/live?userId=${user.id}`}
                                className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1"
                              >
                                Start Interview
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            )}
                            {user.interview?.status === "completed" && (
                              <span className={`text-sm font-medium ${user.interview?.evaluationScore && user.interview.evaluationScore >= 7 ? "text-green-600" : user.interview?.evaluationScore && user.interview.evaluationScore >= 5 ? "text-yellow-600" : "text-gray-600"}`}>
                                Score: {user.interview?.evaluationScore ?? "—"}/10
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.filter(u => u.interview).length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    No interviews scheduled yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
