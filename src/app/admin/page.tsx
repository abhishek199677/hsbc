"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import VirtusaDashboard from "@/components/admin/VirtusaDashboard";
import JobSeekersTab from "@/components/admin/JobSeekersTab";
import JobRequestsTab from "@/components/admin/JobRequestsTab";
import CandidatePipeline from "@/components/admin/CandidatePipeline";
import ProctoringDashboard from "@/components/admin/ProctoringDashboard";
import TeamManagement from "@/components/admin/TeamManagement";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import OpenAIMetrics from "@/components/admin/OpenAIMetrics";
import LoginLogsTab from "@/components/admin/LoginLogsTab";
import AgencyDashboard from "@/components/admin/AgencyDashboard";
import DataTable from "@/components/admin/DataTable";
import { formatTimeLabel } from "@/lib/time";
import EnterpriseSettings from "@/components/admin/EnterpriseSettings";

interface Feedback {
  id: string;
  type: string;
  message: string;
  email: string | null;
  userId: string | null;
  page: string | null;
  status: string;
  createdAt: string;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  profile?: {
    isComplete: boolean;
    currentRole: string | null;
    totalExperience: string | null;
    currentLocation: string | null;
    skills: string | null;
  };
  interview?: {
    date: string;
    time: string;
    status: string;
    mode: string | null;
    videoUrl: string | null;
    captionUrl: string | null;
    evaluationScore: number | null;
    evaluation: string | null;
    proctoringStatus?: string | null;
    proctoringFlags?: number;
    proctoringReport?: string | null;
  };
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? "");
          return val.includes(",") || val.includes('"') || val.includes("\n")
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const router = useRouter();
  const { token, user, organization, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<UserData[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

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
        const [usersRes, feedbackRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/feedback"),
        ]);
        if (usersRes.status === 401 || usersRes.status === 403) {
          router.push("/login");
          return;
        }
        const usersData = await usersRes.json();
        const feedbackData = await feedbackRes.json();
        if (cancelled) return;
        if (usersData.success) setUsers(usersData.users);
        if (feedbackData.success) setFeedback(feedbackData.feedback);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [token, router]);

  const exportInterviews = useCallback(() => {
    const rows = users.filter((u) => u.interview).map((u) => ({
      Name: u.name || "",
      Email: u.email,
      Date: u.interview?.date || "",
      Time: formatTimeLabel(u.interview?.time),
      Mode: u.interview?.mode || "AI Video",
      Status: u.interview?.status || "",
      Score: u.interview?.evaluationScore ?? "",
      "Proctoring": u.interview?.proctoringStatus || "",
      "Proctoring Flags": u.interview?.proctoringFlags ?? 0,
    }));
    downloadCSV(rows, "interviews-export.csv");
  }, [users]);

  const exportFeedback = useCallback(() => {
    const rows = feedback.map((f) => ({
      Type: f.type,
      Message: f.message,
      Email: f.email || "Anonymous",
      Page: f.page || "",
      Status: f.status,
      Date: new Date(f.createdAt).toLocaleDateString(),
    }));
    downloadCSV(rows, "feedback-export.csv");
  }, [feedback]);

  if (authLoading || !user) {
    return (
      <AdminSidebar
        user={null}
        organization={null}
        activeTab="overview"
        onTabChange={() => {}}
      >
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-8 w-8 border-4 border-[#a78bfa] border-t-transparent rounded-full" />
        </div>
      </AdminSidebar>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <VirtusaDashboard token={token} />;
      case "job-seekers":
        return <JobSeekersTab />;
      case "job-requests":
        return <JobRequestsTab />;
      case "agency":
        return <AgencyDashboard token={token} />;
      case "candidates":
        return <CandidatePipeline token={token} />;
      case "interviews":
        return <InterviewsTab users={users} loading={loading} onExport={exportInterviews} />;
      case "login-logs":
        return <LoginLogsTab token={token} />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "openai-metrics":
        return <OpenAIMetrics token={token} />;
      case "feedback":
        return <FeedbackTab feedback={feedback} loading={loading} onExport={exportFeedback} />;
      case "team":
        return <TeamManagement token={token} />;
      case "proctoring":
        return <ProctoringDashboard token={token} />;
      case "enterprise":
        return <EnterpriseSettings token={token} />;
      case "settings":
        return <SettingsTab organization={organization} />;
      default:
        return <VirtusaDashboard token={token} />;
    }
  };

  return (
    <AdminSidebar
      user={user ? { name: user.name, email: user.email, role: user.role || "jobseeker" } : null}
      organization={organization ? { name: organization.name, logoUrl: organization.logoUrl, plan: organization.plan || "starter" } : null}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </AdminSidebar>
  );
}

function InterviewsTab({ users, loading, onExport }: { users: UserData[]; loading: boolean; onExport: () => void }) {
  const interviews = users.filter((u) => u.interview);

  const columns = [
    {
      key: "name",
      label: "Candidate",
      sortable: true,
      render: (u: Record<string, unknown>) => {
        const user = u as unknown as UserData;
        return (
        <div>
          <p className="font-medium text-[#fafafa]">{user.name || "N/A"}</p>
          <p className="text-sm text-[#a1a1aa]">{user.email}</p>
        </div>
        );
      },
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (u: Record<string, unknown>) => {
        const user = u as unknown as UserData;
        return <span className="text-sm text-[#fafafa]">{user.interview?.date}</span>;
      },
    },
    {
      key: "time",
      label: "Time",
      render: (u: Record<string, unknown>) => {
        const user = u as unknown as UserData;
        return <span className="text-sm text-[#fafafa]">{formatTimeLabel(user.interview?.time)}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      filterable: true,
      filterOptions: ["completed", "scheduled", "cancelled"],
      render: (u: Record<string, unknown>) => {
        const user = u as unknown as UserData;
        return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          user.interview?.status === "completed"
            ? "bg-[#22c55e]/10 text-[#22c55e]"
            : user.interview?.status === "scheduled"
            ? "bg-[#3b82f6]/10 text-[#3b82f6]"
            : "bg-[#27272a] text-[#a1a1aa]"
        }`}>
          {user.interview?.status || "Unknown"}
        </span>
        );
      },
    },
    {
      key: "score",
      label: "Score",
      sortable: true,
      render: (u: Record<string, unknown>) => {
        const user = u as unknown as UserData;
        const score = user.interview?.evaluationScore;
        if (score == null) return <span className="text-[#a1a1aa] text-sm">—</span>;
        return (
          <span className={`text-sm font-medium ${score >= 7 ? "text-[#22c55e]" : score >= 5 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
            {score}/10
          </span>
        );
      },
    },
    {
      key: "proctoring",
      label: "Proctoring",
      filterable: true,
      filterOptions: ["pass", "review", "fail", "off"],
      render: (u: Record<string, unknown>) => {
        const user = u as unknown as UserData;
        const status = user.interview?.proctoringStatus;
        if (!status) return <span className="text-[#a1a1aa] text-sm">—</span>;
        const badges: Record<string, string> = {
          pass: "bg-[#22c55e]/10 text-[#22c55e]",
          review: "bg-[#f59e0b]/10 text-[#f59e0b]",
          fail: "bg-[#ef4444]/10 text-[#ef4444]",
          off: "bg-[#27272a] text-[#a1a1aa]",
        };
        return (
          <div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || "bg-[#27272a] text-[#a1a1aa]"}`}>
              {status === "pass" ? "✓ Clean" : status === "review" ? "⚠ Review" : status === "fail" ? "⚠ Failed" : "Monitor off"}
            </span>
            {(user.interview?.proctoringFlags ?? 0) > 0 && (
              <p className="text-[11px] text-[#a1a1aa] mt-1">{user.interview?.proctoringFlags} incident(s)</p>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (u: Record<string, unknown>) => {
        const user = u as unknown as UserData;
        return (
        <div className="flex items-center gap-3">
          {user.interview?.status === "completed" && user.interview?.videoUrl ? (
            <a
              href={`/interview/live?userId=${user.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3b82f6] hover:text-[#3b82f6] text-sm font-medium"
            >
              Watch
            </a>
          ) : (
            <a
              href={`/interview/live?userId=${user.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3b82f6] hover:text-[#3b82f6] text-sm font-medium"
            >
              Start
            </a>
          )}
        </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">Interview Management</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">View and manage all candidate interviews</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#a78bfa] border-t-transparent rounded-full" />
        </div>
      ) : (
        <DataTable
          data={interviews as unknown as Record<string, unknown>[]}
          columns={columns}
          searchable
          searchKeys={["name", "email"]}
          searchPlaceholder="Search interviews..."
          onExport={onExport}
          exportLabel="Export CSV"
          emptyMessage="No interviews scheduled yet."
          pageSize={25}
        />
      )}
    </div>
  );
}

function FeedbackTab({ feedback, loading, onExport }: { feedback: Feedback[]; loading: boolean; onExport: () => void }) {
  const columns = [
    {
      key: "type",
      label: "Type",
      sortable: true,
      filterable: true,
      filterOptions: ["general", "bug", "feature"],
      render: (f: Record<string, unknown>) => {
        const item = f as unknown as Feedback;
        return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.type === "bug" ? "bg-[#ef4444]/10 text-[#ef4444]" : item.type === "feature" ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "bg-[#27272a] text-[#a1a1aa]"
        }`}>
          {item.type === "bug" ? "Bug" : item.type === "feature" ? "Feature Request" : "General"}
        </span>
        );
      },
    },
    {
      key: "message",
      label: "Message",
      render: (f: Record<string, unknown>) => {
        const item = f as unknown as Feedback;
        return <p className="text-sm text-[#fafafa] max-w-md truncate">{item.message}</p>;
      },
    },
    {
      key: "email",
      label: "From",
      sortable: true,
      render: (f: Record<string, unknown>) => {
        const item = f as unknown as Feedback;
        return <span className="text-sm text-[#a1a1aa]">{item.email || "Anonymous"}</span>;
      },
    },
    {
      key: "page",
      label: "Page",
      render: (f: Record<string, unknown>) => {
        const item = f as unknown as Feedback;
        return <span className="text-sm text-[#a1a1aa]">{item.page || "N/A"}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      filterOptions: ["open", "in_progress", "resolved"],
      render: (f: Record<string, unknown>) => {
        const item = f as unknown as Feedback;
        return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.status === "open" ? "bg-[#f59e0b]/10 text-[#f59e0b]" : item.status === "in_progress" ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "bg-[#22c55e]/10 text-[#22c55e]"
        }`}>
          {item.status === "open" ? "Open" : item.status === "in_progress" ? "In Progress" : "Resolved"}
        </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (f: Record<string, unknown>) => {
        const item = f as unknown as Feedback;
        return <span className="text-sm text-[#a1a1aa]">{new Date(item.createdAt).toLocaleDateString()}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">User Feedback</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">View and manage user feedback submissions</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#a78bfa] border-t-transparent rounded-full" />
        </div>
      ) : (
        <DataTable
          data={feedback as unknown as Record<string, unknown>[]}
          columns={columns}
          searchable
          searchKeys={["message", "email"]}
          searchPlaceholder="Search feedback..."
          onExport={onExport}
          exportLabel="Export CSV"
          emptyMessage="No feedback submitted yet."
          pageSize={25}
        />
      )}
    </div>
  );
}

function SettingsTab({ organization }: { organization: { name: string | null; plan: string } | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa]">Organization Settings</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Manage your organization details and preferences</p>
      </div>
      <div className="bg-[#18181b] rounded-xl border border-[#27272a] p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#fafafa] mb-4">Organization Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Organization Name</label>
              <input
                type="text"
                value={organization?.name || ""}
                disabled
                className="w-full border border-[#27272a] rounded-lg px-3 py-2 text-sm bg-[#18181b]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Plan</label>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  organization?.plan === "enterprise" ? "bg-[#a855f7]/10 text-[#a855f7]" :
                  organization?.plan === "pro" ? "bg-[#3b82f6]/10 text-[#3b82f6]" :
                  "bg-[#27272a] text-[#a1a1aa]"
                }`}>
                  {organization?.plan === "enterprise" ? "Enterprise" : organization?.plan === "pro" ? "Pro" : "Starter"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#fafafa] mb-4">Branding</h3>
          <p className="text-sm text-[#a1a1aa]">Organization branding and customization options coming soon.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#fafafa] mb-4">Integrations</h3>
          <p className="text-sm text-[#a1a1aa]">Third-party integrations management coming soon.</p>
        </div>
      </div>
    </div>
  );
}
