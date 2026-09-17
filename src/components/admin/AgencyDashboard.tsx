"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Briefcase,
  UserPlus,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Upload,
  Send,
  ClipboardList,
  Calendar,
  Brain,
  AlertTriangle,
  FileText,
  MessageSquare,
} from "lucide-react";
import { nextSubmissionStage, submissionStageLabel } from "@/lib/recruitment-workflow";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  _count: { jobRequisitions: number; placements: number };
}

interface JobRequisition {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  location: string | null;
  jobType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceMin: number | null;
  experienceMax: number | null;
  status: string;
  priority: string;
  openings: number;
  filledCount: number;
  deadline: string | null;
  client: { id: string; name: string; industry: string | null };
  _count: { candidates: number; placements: number };
}

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  currentRole: string | null;
  currentCompany: string | null;
  totalExperience: string | null;
  skills: string | null;
  location: string | null;
  expectedSalary: number | null;
  noticePeriod: string | null;
  status: string;
  rating: number | null;
  _count: { submissions: number; placements: number };
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  openJobs: number;
  totalCandidates: number;
  activePlacements: number;
  totalCommission: number;
}

interface CandidateSubmission {
  id: string;
  status: string;
  feedback: string | null;
  interviewDate: string | null;
  createdAt: string;
  candidate: { id: string; name: string; email: string | null; phone: string | null; skills: string | null };
  jobRequisition: { id: string; title: string; client: { id: string; name: string } };
}

interface PlacementRecord {
  id: string;
  startDate: string;
  endDate: string | null;
  salary: number | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  status: string;
  candidate: { id: string; name: string; email: string | null; phone: string | null };
  client: { id: string; name: string; industry: string | null };
  jobRequisition: { id: string; title: string } | null;
  createdAt: string;
}

export default function AgencyDashboard({ token }: { token: string | null }) {
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "jobs" | "candidates" | "pipeline" | "placements" | "screening" | "clientJds" | "interviews">("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [submissions, setSubmissions] = useState<CandidateSubmission[]>([]);
  const [placements, setPlacements] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const [clientsRes, jobsRes, candidatesRes, submissionsRes, placementsRes] = await Promise.all([
        fetch("/api/agency/clients", { credentials: "same-origin" }),
        fetch("/api/agency/jobs", { credentials: "same-origin" }),
        fetch("/api/agency/candidates", { credentials: "same-origin" }),
        fetch("/api/agency/submissions", { credentials: "same-origin" }),
        fetch("/api/agency/placements", { credentials: "same-origin" }),
      ]);

      const [clientsData, jobsData, candidatesData, submissionsData, placementsData] = await Promise.all([
        clientsRes.json(),
        jobsRes.json(),
        candidatesRes.json(),
        submissionsRes.json(),
        placementsRes.json(),
      ]);

      if (clientsData.success) setClients(clientsData.clients);
      if (jobsData.success) setJobs(jobsData.jobs);
      if (candidatesData.success) setCandidates(candidatesData.candidates);
      if (submissionsData.success) setSubmissions(submissionsData.submissions);
      if (placementsData.success) setPlacements(placementsData.placements);

      // Calculate stats
      setStats({
        totalClients: clientsData.clients?.length || 0,
        activeClients: clientsData.clients?.filter((c: Client) => c.status === "active").length || 0,
        openJobs: jobsData.jobs?.filter((j: JobRequisition) => j.status === "open").length || 0,
        totalCandidates: candidatesData.candidates?.length || 0,
        activePlacements: placementsData.stats?.activePlacements || 0,
        totalCommission: placementsData.stats?.totalCommission || 0,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchDashboardData);
  }, []);

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "clients", label: "Clients", icon: Building2 },
    { id: "jobs", label: "Job Requisitions", icon: Briefcase },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "pipeline", label: "Pipeline", icon: ClipboardList },
    { id: "placements", label: "Placements", icon: UserPlus },
    { id: "screening", label: "AI Screening", icon: Brain },
    { id: "interviews", label: "Interviews", icon: MessageSquare },
    { id: "clientJds", label: "Client JDs", icon: FileText },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Agency Dashboard</h1>
          <p className="text-sm text-[#a1a1aa]">Manage clients, jobs, and candidates</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#27272a]">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-[#a78bfa] text-[#a78bfa]"
                  : "border-transparent text-[#a1a1aa] hover:text-[#a1a1aa] hover:border-[#27272a]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Total Clients" value={stats?.totalClients || 0} icon={Building2} color="blue" />
            <StatCard title="Active Clients" value={stats?.activeClients || 0} icon={CheckCircle} color="green" />
            <StatCard title="Open Jobs" value={stats?.openJobs || 0} icon={Briefcase} color="purple" />
            <StatCard title="Total Candidates" value={stats?.totalCandidates || 0} icon={Users} color="indigo" />
            <StatCard title="Active Placements" value={stats?.activePlacements || 0} icon={UserPlus} color="emerald" />
            <StatCard title="Commission Earned" value={`₹${stats?.totalCommission || 0}`} icon={DollarSign} color="yellow" />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
              <h3 className="text-lg font-semibold text-[#fafafa] mb-4">Recent Job Requisitions</h3>
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-[#18181b] rounded-lg">
                    <div>
                      <p className="font-medium text-[#fafafa]">{job.title}</p>
                      <p className="text-sm text-[#a1a1aa]">{job.client.name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      job.status === "open" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                      job.status === "on-hold" ? "bg-[#f59e0b]/10 text-[#f59e0b]" :
                      "bg-[#27272a] text-[#a1a1aa]"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
              <h3 className="text-lg font-semibold text-[#fafafa] mb-4">Recent Candidates</h3>
              <div className="space-y-3">
                {candidates.slice(0, 5).map((candidate) => (
                  <div key={candidate.id} className="flex items-center justify-between p-3 bg-[#18181b] rounded-lg">
                    <div>
                      <p className="font-medium text-[#fafafa]">{candidate.name}</p>
                      <p className="text-sm text-[#a1a1aa]">{candidate.currentRole || "No role specified"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {candidate.rating && (
                        <Star className="h-4 w-4 text-[#f5c542] fill-yellow-400" />
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        candidate.status === "sourced" ? "bg-[#3b82f6]/10 text-[#3b82f6]" :
                        candidate.status === "interviewed" ? "bg-[#a855f7]/10 text-[#a855f7]" :
                        candidate.status === "placed" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                        "bg-[#27272a] text-[#a1a1aa]"
                      }`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === "clients" && (
        <ClientsTab token={token} clients={clients} onRefresh={fetchDashboardData} />
      )}

      {/* Jobs Tab */}
      {activeTab === "jobs" && (
        <JobsTab token={token} jobs={jobs} clients={clients} onRefresh={fetchDashboardData} />
      )}

      {/* Candidates Tab */}
      {activeTab === "candidates" && (
        <CandidatesTab candidates={candidates} jobs={jobs} onRefresh={fetchDashboardData} />
      )}

      {activeTab === "pipeline" && (
        <PipelineTab submissions={submissions} onRefresh={fetchDashboardData} />
      )}

      {/* Placements Tab */}
      {activeTab === "placements" && (
        <PlacementsTab placements={placements} onRefresh={fetchDashboardData} />
      )}

      {/* AI Screening Tab */}
      {activeTab === "screening" && (
        <ScreeningTab token={token} candidates={candidates} />
      )}

      {/* Interviews Tab */}
      {activeTab === "interviews" && (
        <InterviewsTab token={token} candidates={candidates} />
      )}

      {/* Client JDs Tab */}
      {activeTab === "clientJds" && (
        <ClientJDsTab token={token} clients={clients} onRefresh={fetchDashboardData} />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-[#3b82f6]/10 text-[#3b82f6]",
    green: "bg-[#22c55e]/10 text-[#22c55e]",
    purple: "bg-[#a855f7]/10 text-[#a855f7]",
    indigo: "bg-indigo-100 text-[#a78bfa]",
    emerald: "bg-[#10b981]/10 text-[#10b981]",
    yellow: "bg-[#f59e0b]/10 text-[#f59e0b]",
  };

  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#a1a1aa]">{title}</p>
          <p className="text-2xl font-bold text-[#fafafa]">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function ClientsTab({ token, clients, onRefresh }: { token: string | null; clients: Client[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredClients = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-[#27272a] rounded-lg focus:ring-2 focus:ring-[#a78bfa]"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-[#27272a] rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button
          onClick={() => { setEditingClient(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#a78bfa] text-white rounded-lg hover:bg-[#8b5cf6]"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden">
        <table className="min-w-full divide-y divide-[#27272a]">
          <thead className="bg-[#18181b]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Industry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Jobs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Placements</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-[#27272a]">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-[#fafafa]">{client.name}</p>
                    {client.website && (
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#a78bfa] hover:underline">
                        {client.website}
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#a1a1aa]">{client.industry || "—"}</td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="text-[#fafafa]">{client.contactName || "—"}</p>
                    <p className="text-[#a1a1aa]">{client.contactEmail || ""}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#fafafa]">{client._count.jobRequisitions}</td>
                <td className="px-6 py-4 text-sm text-[#fafafa]">{client._count.placements}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    client.status === "active" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                    client.status === "inactive" ? "bg-[#27272a] text-[#a1a1aa]" :
                    "bg-[#ef4444]/10 text-[#ef4444]"
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingClient(client); setShowForm(true); }} className="text-[#a1a1aa] hover:text-[#a78bfa]">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-[#a1a1aa] hover:text-[#ef4444]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ClientForm
          token={token}
          client={editingClient}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

function ClientForm({ token, client, onClose, onSaved }: { token: string | null; client: Client | null; onClose: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState({
    name: client?.name || "",
    industry: client?.industry || "",
    website: client?.website || "",
    contactName: client?.contactName || "",
    contactEmail: client?.contactEmail || "",
    contactPhone: client?.contactPhone || "",
    address: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = "/api/agency/clients";
      const method = client ? "PUT" : "POST";
      const body = client ? { id: client.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.error || "Failed to save client");
      }
    } catch (error) {
      console.error("Save client error:", error);
      setError("Failed to save client. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#18181b] rounded-xl shadow-xl border border-[#27272a] max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#27272a]">
          <h2 className="text-lg font-semibold">{client ? "Edit Client" : "Add Client"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444]">
              {error}
            </div>
          )}
          <input
            placeholder="Company Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            placeholder="Industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            placeholder="Website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            placeholder="Contact Person"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            placeholder="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            placeholder="Contact Phone"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows={2}
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows={2}
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#a78bfa] text-white rounded-lg hover:bg-[#8b5cf6]">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobsTab({ token, jobs, clients, onRefresh }: { token: string | null; jobs: JobRequisition[]; clients: Client[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase()) ||
      j.client.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || j.status === filterStatus;
    const matchesClient = filterClient === "all" || j.client.id === filterClient;
    return matchesSearch && matchesStatus && matchesClient;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-[#27272a] rounded-lg"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="on-hold">On Hold</option>
            <option value="filled">Filled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={clients.length === 0}
          title={clients.length === 0 ? "Add a client before creating a job" : undefined}
          className="flex items-center gap-2 rounded-lg bg-[#a78bfa] px-4 py-2 text-white hover:bg-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Create Job
        </button>
      </div>

      {clients.length === 0 && (
        <div className="rounded-lg border border-[#f59e0b]/30 bg-amber-50 px-4 py-3 text-sm text-[#f59e0b]">
          Add a client first, then create job requirements for that client.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[#fafafa]">{job.title}</h3>
                <p className="text-sm text-[#a1a1aa]">{job.client.name}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                job.priority === "urgent" ? "bg-[#ef4444]/10 text-[#ef4444]" :
                job.priority === "high" ? "bg-[#f97316]/10 text-[#f97316]" :
                job.priority === "normal" ? "bg-[#3b82f6]/10 text-[#3b82f6]" :
                "bg-[#27272a] text-[#a1a1aa]"
              }`}>
                {job.priority}
              </span>
            </div>
            <div className="space-y-2 text-sm text-[#a1a1aa]">
              {job.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {job.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> {job.jobType} • {job.openings} opening(s)
              </div>
              {(job.salaryMin || job.salaryMax) && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {job.salaryMin && job.salaryMax
                    ? `₹${job.salaryMin.toLocaleString()} - ₹${job.salaryMax.toLocaleString()}`
                    : job.salaryMin
                    ? `₹${job.salaryMin.toLocaleString()}+`
                    : `Up to ₹${job.salaryMax?.toLocaleString()}`}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-[#a1a1aa]">{job._count.candidates} candidates</span>
              <span className={`px-2 py-1 rounded-full ${
                job.status === "open" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                job.status === "on-hold" ? "bg-[#f59e0b]/10 text-[#f59e0b]" :
                "bg-[#27272a] text-[#a1a1aa]"
              }`}>
                {job.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <JobForm
          clients={clients}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function JobForm({ clients, onClose, onSaved }: { clients: Client[]; onClose: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState({
    clientId: clients[0]?.id || "",
    title: "",
    description: "",
    requirements: "",
    location: "",
    jobType: "full-time",
    salaryMin: "",
    salaryMax: "",
    experienceMin: "",
    experienceMax: "",
    priority: "normal",
    openings: "1",
    deadline: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/agency/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
          salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
          experienceMin: formData.experienceMin ? Number(formData.experienceMin) : undefined,
          experienceMax: formData.experienceMax ? Number(formData.experienceMax) : undefined,
          openings: Number(formData.openings) || 1,
          deadline: formData.deadline || undefined,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to create job");
        return;
      }

      onSaved();
    } catch (submitError) {
      console.error("Create job error:", submitError);
      setError("Failed to create job. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[#18181b] shadow-xl">
        <div className="border-b border-[#27272a] p-6">
          <h2 className="text-lg font-semibold text-[#fafafa]">Create Job Requisition</h2>
          <p className="text-sm text-[#a1a1aa]">Add the client requirement your recruiters need to fill.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444]">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-[#a1a1aa]">
              Client *
              <select
                value={formData.clientId}
                onChange={(event) => updateField("clientId", event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
                required
              >
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Job Title *
              <input
                value={formData.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Java Developer"
                className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
                required
              />
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Location
              <input value={formData.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Hyderabad" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Employment Type
              <select value={formData.jobType} onChange={(event) => updateField("jobType", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2">
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Minimum Experience (years)
              <input type="number" min="0" value={formData.experienceMin} onChange={(event) => updateField("experienceMin", event.target.value)} placeholder="4" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Maximum Experience (years)
              <input type="number" min="0" value={formData.experienceMax} onChange={(event) => updateField("experienceMax", event.target.value)} placeholder="6" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Minimum Annual Salary
              <input type="number" min="0" value={formData.salaryMin} onChange={(event) => updateField("salaryMin", event.target.value)} placeholder="800000" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Maximum Annual Salary
              <input type="number" min="0" value={formData.salaryMax} onChange={(event) => updateField("salaryMax", event.target.value)} placeholder="1200000" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Openings
              <input type="number" min="1" value={formData.openings} onChange={(event) => updateField("openings", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Priority
              <select value={formData.priority} onChange={(event) => updateField("priority", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="text-sm font-medium text-[#a1a1aa] sm:col-span-2">
              Application Deadline
              <input type="date" value={formData.deadline} onChange={(event) => updateField("deadline", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
            </label>
          </div>
          <label className="block text-sm font-medium text-[#a1a1aa]">
            Job Description
            <textarea value={formData.description} onChange={(event) => updateField("description", event.target.value)} rows={3} placeholder="Describe the role and responsibilities" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
          </label>
          <label className="block text-sm font-medium text-[#a1a1aa]">
            Required Skills and Qualifications
            <textarea value={formData.requirements} onChange={(event) => updateField("requirements", event.target.value)} rows={3} placeholder="Java, Spring Boot, Microservices, SQL..." className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
          </label>
          <label className="block text-sm font-medium text-[#a1a1aa]">
            Internal Recruiter Notes
            <textarea value={formData.notes} onChange={(event) => updateField("notes", event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" />
          </label>
          <div className="flex justify-end gap-3 border-t border-[#27272a] pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#27272a] px-4 py-2 text-[#a1a1aa]">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#a78bfa] px-4 py-2 text-white hover:bg-[#8b5cf6] disabled:opacity-50">
              {saving ? "Creating..." : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CandidatesTab({ candidates, jobs, onRefresh }: { candidates: Candidate[]; jobs: JobRequisition[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [submissionCandidate, setSubmissionCandidate] = useState<Candidate | null>(null);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.currentRole?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesSource = filterSource === "all" || c.source === filterSource;
    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-[#27272a] rounded-lg"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Status</option>
            <option value="sourced">Sourced</option>
            <option value="screening">Screening</option>
            <option value="interviewed">Interviewed</option>
            <option value="offered">Offered</option>
            <option value="placed">Placed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Sources</option>
            <option value="naukri">Naukri</option>
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Referral</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <button
          onClick={() => setShowCandidateForm(true)}
          className="flex items-center gap-2 rounded-lg bg-[#a78bfa] px-4 py-2 text-white hover:bg-[#8b5cf6]"
        >
          <Plus className="h-4 w-4" />
          Add / Import Candidates
        </button>
      </div>

      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden">
        <table className="min-w-full divide-y divide-[#27272a]">
          <thead className="bg-[#18181b]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Experience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Skills</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {filteredCandidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-[#27272a]">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-[#fafafa]">{candidate.name}</p>
                    <p className="text-sm text-[#a1a1aa]">{candidate.email || candidate.phone || "No contact"}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                  {candidate.totalExperience || "—"}
                  {candidate.currentCompany && (
                    <p className="text-xs text-[#a1a1aa]">@ {candidate.currentCompany}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills?.split(",").slice(0, 3).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#27272a] text-[#a1a1aa] text-xs rounded">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#3b82f6]/10 text-[#3b82f6]">
                    {candidate.source}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    candidate.status === "placed" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                    candidate.status === "interviewed" ? "bg-[#a855f7]/10 text-[#a855f7]" :
                    candidate.status === "screening" ? "bg-[#f59e0b]/10 text-[#f59e0b]" :
                    "bg-[#27272a] text-[#a1a1aa]"
                  }`}>
                    {candidate.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (candidate.rating || 0) ? "text-[#f5c542] fill-yellow-400" : "text-[#a1a1aa]"
                        }`}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSubmissionCandidate(candidate)}
                      title="Submit candidate to a job"
                      className="flex items-center gap-1 rounded-md bg-[#a78bfa]/10 px-2 py-1 text-xs font-medium text-[#a78bfa] hover:bg-[#a78bfa]/20"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit to Job
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCandidateForm && (
        <CandidateForm
          onClose={() => setShowCandidateForm(false)}
          onSaved={() => {
            setShowCandidateForm(false);
            onRefresh();
          }}
        />
      )}

      {submissionCandidate && (
        <CandidateSubmissionForm
          candidate={submissionCandidate}
          jobs={jobs.filter((job) => job.status === "open")}
          onClose={() => setSubmissionCandidate(null)}
          onSaved={() => {
            setSubmissionCandidate(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function CandidateForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<"manual" | "csv" | "resume">("manual");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "naukri",
    naukriId: "",
    currentRole: "",
    currentCompany: "",
    totalExperience: "",
    skills: "",
    location: "",
    expectedSalary: "",
    noticePeriod: "",
    rating: "",
    notes: "",
  });
  const [csvCandidates, setCsvCandidates] = useState<Record<string, unknown>[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleCsvFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setCsvFileName(file.name);

    try {
      const rows = parseCandidateCsv(await file.text());
      if (rows.length === 0) {
        setError("No candidates were found. Ensure the CSV includes a Name or Candidate Name column.");
        return;
      }
      setCsvCandidates(rows);
    } catch (parseError) {
      console.error("CSV parse error:", parseError);
      setError("The CSV file could not be read.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (mode === "resume") {
      if (resumeFiles.length === 0) {
        setError("Select at least one PDF or DOCX resume.");
        return;
      }

      setSaving(true);
      try {
        const resumeData = new FormData();
        resumeFiles.forEach((file) => resumeData.append("files", file));
        resumeData.append("source", "resume");
        const response = await fetch("/api/agency/candidates", {
          method: "POST",
          credentials: "same-origin",
          body: resumeData,
        });
        const data = await response.json();
        if (!data.success) {
          setError(data.error || "No resumes could be imported");
          return;
        }
        if (data.failed?.length) {
          setError(`${data.count} imported. ${data.failed.length} failed: ${data.failed.map((item: { filename: string }) => item.filename).join(", ")}`);
          return;
        }
        onSaved();
      } catch (submitError) {
        console.error("Resume import error:", submitError);
        setError("Failed to import resumes. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    const payload = mode === "manual"
      ? {
          ...formData,
          expectedSalary: formData.expectedSalary ? Number(formData.expectedSalary) : undefined,
          rating: formData.rating ? Number(formData.rating) : undefined,
        }
      : csvCandidates;

    if (mode === "csv" && csvCandidates.length === 0) {
      setError("Select a Naukri CSV file before importing.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/agency/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.error || "Failed to save candidates");
        return;
      }
      onSaved();
    } catch (submitError) {
      console.error("Save candidate error:", submitError);
      setError("Failed to save candidates. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[#18181b] shadow-xl">
        <div className="border-b border-[#27272a] p-6">
          <h2 className="text-lg font-semibold text-[#fafafa]">Add Candidates</h2>
          <p className="text-sm text-[#a1a1aa]">Enter one candidate or import candidates exported from Naukri as CSV.</p>
        </div>
        <div className="flex border-b border-[#27272a] px-6">
          <button type="button" onClick={() => setMode("manual")} className={`border-b-2 px-4 py-3 text-sm font-medium ${mode === "manual" ? "border-[#a78bfa] text-[#a78bfa]" : "border-transparent text-[#a1a1aa]"}`}>Manual Entry</button>
          <button type="button" onClick={() => setMode("csv")} className={`border-b-2 px-4 py-3 text-sm font-medium ${mode === "csv" ? "border-[#a78bfa] text-[#a78bfa]" : "border-transparent text-[#a1a1aa]"}`}>Naukri CSV Import</button>
          <button type="button" onClick={() => setMode("resume")} className={`border-b-2 px-4 py-3 text-sm font-medium ${mode === "resume" ? "border-[#a78bfa] text-[#a78bfa]" : "border-transparent text-[#a1a1aa]"}`}>Resume Upload</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && <div className="rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444]">{error}</div>}

          {mode === "manual" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[#a1a1aa]">Name *<input required value={formData.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Source<select value={formData.source} onChange={(event) => updateField("source", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"><option value="naukri">Naukri</option><option value="linkedin">LinkedIn</option><option value="referral">Referral</option><option value="manual">Manual</option></select></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Email<input type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Phone<input value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Current Role<input value={formData.currentRole} onChange={(event) => updateField("currentRole", event.target.value)} placeholder="Java Developer" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Current Company<input value={formData.currentCompany} onChange={(event) => updateField("currentCompany", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Experience<input value={formData.totalExperience} onChange={(event) => updateField("totalExperience", event.target.value)} placeholder="5 years" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Location<input value={formData.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Mumbai" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa] sm:col-span-2">Skills<input value={formData.skills} onChange={(event) => updateField("skills", event.target.value)} placeholder="Java, Spring Boot, SQL" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Expected Annual Salary<input type="number" min="0" value={formData.expectedSalary} onChange={(event) => updateField("expectedSalary", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Notice Period<input value={formData.noticePeriod} onChange={(event) => updateField("noticePeriod", event.target.value)} placeholder="30 days" className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Naukri Profile ID<input value={formData.naukriId} onChange={(event) => updateField("naukriId", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
              <label className="text-sm font-medium text-[#a1a1aa]">Recruiter Rating<select value={formData.rating} onChange={(event) => updateField("rating", event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"><option value="">Not rated</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>
              <label className="text-sm font-medium text-[#a1a1aa] sm:col-span-2">Recruiter Notes<textarea value={formData.notes} onChange={(event) => updateField("notes", event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" /></label>
            </div>
          ) : mode === "csv" ? (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#27272a] px-6 py-10 text-center hover:border-indigo-400 hover:bg-[#a78bfa]/10/40">
                <Upload className="mb-3 h-8 w-8 text-[#a78bfa]" />
                <span className="font-medium text-[#fafafa]">Select Naukri CSV export</span>
                <span className="mt-1 text-sm text-[#a1a1aa]">CSV columns such as Candidate Name, Email, Mobile, Experience, Skills and Location are recognized.</span>
                <input type="file" accept=".csv,text/csv" onChange={(event) => handleCsvFile(event.target.files?.[0])} className="hidden" />
              </label>
              {csvFileName && (
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-[#22c55e]">
                  {csvFileName}: {csvCandidates.length} candidate{csvCandidates.length === 1 ? "" : "s"} ready to import.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#27272a] px-6 py-10 text-center hover:border-indigo-400 hover:bg-[#a78bfa]/10/40">
                <Upload className="mb-3 h-8 w-8 text-[#a78bfa]" />
                <span className="font-medium text-[#fafafa]">Select PDF or DOCX resumes</span>
                <span className="mt-1 text-sm text-[#a1a1aa]">Upload up to 20 resumes. Candidate details will be extracted automatically.</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setResumeFiles(Array.from(event.target.files || []).slice(0, 20))}
                  className="hidden"
                />
              </label>
              {resumeFiles.length > 0 && (
                <div className="rounded-lg bg-[#a78bfa]/10 px-4 py-3 text-sm text-[#a78bfa]">
                  {resumeFiles.length} resume{resumeFiles.length === 1 ? "" : "s"} selected: {resumeFiles.map((file) => file.name).join(", ")}
                </div>
              )}
              <p className="text-xs text-[#a1a1aa]">PDF and DOCX files must contain readable document text. Image-only scans require OCR and will be reported separately.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[#27272a] pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#27272a] px-4 py-2 text-[#a1a1aa]">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#a78bfa] px-4 py-2 text-white hover:bg-[#8b5cf6] disabled:opacity-50">
              {saving ? "Saving..." : mode === "manual" ? "Add Candidate" : mode === "csv" ? `Import ${csvCandidates.length || ""} Candidates` : `Import ${resumeFiles.length || ""} Resumes`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CandidateSubmissionForm({ candidate, jobs, onClose, onSaved }: { candidate: Candidate; jobs: JobRequisition[]; onClose: () => void; onSaved: () => void }) {
  const [jobId, setJobId] = useState(jobs[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!jobId) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/agency/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ candidateId: candidate.id, jobRequisitionId: jobId }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.error || "Failed to submit candidate");
        return;
      }
      onSaved();
    } catch (submitError) {
      console.error("Candidate submission error:", submitError);
      setError("Failed to submit candidate. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-[#18181b] shadow-xl">
        <div className="border-b border-[#27272a] p-6">
          <h2 className="text-lg font-semibold text-[#fafafa]">Submit Candidate to Job</h2>
          <p className="text-sm text-[#a1a1aa]">{candidate.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && <div className="rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444]">{error}</div>}
          {jobs.length > 0 ? (
            <label className="block text-sm font-medium text-[#a1a1aa]">
              Open Job Requisition
              <select value={jobId} onChange={(event) => setJobId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2" required>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} - {job.client.name}</option>)}
              </select>
            </label>
          ) : (
            <div className="rounded-lg border border-[#f59e0b]/30 bg-amber-50 px-4 py-3 text-sm text-[#f59e0b]">There are no open job requisitions. Create or reopen a job first.</div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-[#27272a] px-4 py-2 text-[#a1a1aa]">Cancel</button>
            <button type="submit" disabled={saving || jobs.length === 0} className="rounded-lg bg-[#a78bfa] px-4 py-2 text-white hover:bg-[#8b5cf6] disabled:opacity-50">{saving ? "Submitting..." : "Submit Candidate"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function parseCandidateCsv(csv: string): Record<string, unknown>[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const parseLine = (line: string) => {
    const values: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index++) {
      const character = line[index];
      if (character === '"' && quoted && line[index + 1] === '"') {
        value += '"';
        index++;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else {
        value += character;
      }
    }
    values.push(value.trim());
    return values;
  };

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const headers = parseLine(lines[0]).map(normalize);
  const aliases: Record<string, string[]> = {
    name: ["name", "candidatename", "fullname"],
    email: ["email", "emailid", "emailaddress"],
    phone: ["phone", "mobile", "mobilenumber", "contactnumber"],
    naukriId: ["naukriid", "profileid", "resumeid"],
    currentRole: ["currentrole", "currentdesignation", "designation", "role"],
    currentCompany: ["currentcompany", "company", "employer"],
    totalExperience: ["totalexperience", "experience", "workexperience"],
    skills: ["skills", "keyskills", "primaryskills"],
    location: ["location", "currentlocation", "city"],
    expectedSalary: ["expectedsalary", "expectedctc"],
    noticePeriod: ["noticeperiod", "notice"],
  };

  const columnFor = (field: string) => headers.findIndex((header) => aliases[field].includes(header));
  return lines.slice(1).map(parseLine).map((values) => {
    const candidate: Record<string, unknown> = { source: "naukri" };
    for (const field of Object.keys(aliases)) {
      const column = columnFor(field);
      if (column >= 0 && values[column]) candidate[field] = values[column];
    }
    if (candidate.expectedSalary) {
      const salary = Number(String(candidate.expectedSalary).replace(/[^0-9.]/g, ""));
      candidate.expectedSalary = Number.isFinite(salary) ? salary : undefined;
    }
    return candidate;
  }).filter((candidate) => Boolean(candidate.name));
}
 
function PipelineTab({ submissions, onRefresh }: { submissions: CandidateSubmission[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
 
  const handleAdvance = async (submission: CandidateSubmission) => {
    const nextStage = nextSubmissionStage(submission.status);
    if (!nextStage) return;
 
    setUpdatingId(submission.id);
    setError("");
    try {
      const res = await fetch("/api/agency/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: submission.id, status: nextStage }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to advance stage");
        return;
      }
      onRefresh();
    } catch (e) {
      setError("Failed to advance stage");
    } finally {
      setUpdatingId(null);
    }
  };
 
  const handleScheduleInterview = async (submission: CandidateSubmission, date: string) => {
    setUpdatingId(submission.id);
    setError("");
    try {
      const res = await fetch("/api/agency/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: submission.id, status: "interview-scheduled", interviewDate: date }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to schedule interview");
        return;
      }
      onRefresh();
    } catch (e) {
      setError("Failed to schedule interview");
    } finally {
      setUpdatingId(null);
    }
  };
 
  const handleOffer = async (submission: CandidateSubmission) => {
    setUpdatingId(submission.id);
    setError("");
    try {
      const res = await fetch("/api/agency/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: submission.id, status: "offered" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to make offer");
        return;
      }
      onRefresh();
    } catch (e) {
      setError("Failed to make offer");
    } finally {
      setUpdatingId(null);
    }
  };
 
  const handleReject = async (submission: CandidateSubmission) => {
    if (!confirm("Reject this candidate?")) return;
    setUpdatingId(submission.id);
    setError("");
    try {
      const res = await fetch("/api/agency/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: submission.id, status: "rejected" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to reject");
        return;
      }
      onRefresh();
    } catch (e) {
      setError("Failed to reject");
    } finally {
      setUpdatingId(null);
    }
  };
 
  const handlePlace = async (submission: CandidateSubmission) => {
    const startDate = prompt("Joining date (YYYY-MM-DD):");
    if (!startDate) return;
    const salary = prompt("Annual salary:");
    if (!salary) return;
    const commissionRate = prompt("Commission rate %:");
    if (!commissionRate) return;
 
    setUpdatingId(submission.id);
    setError("");
    try {
      const res = await fetch("/api/agency/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          candidateId: submission.candidate.id,
          clientId: submission.jobRequisition.client.id,
          jobRequisitionId: submission.jobRequisition.id,
          startDate,
          salary: Number(salary),
          commissionRate: Number(commissionRate),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to create placement");
        return;
      }
      onRefresh();
    } catch (e) {
      setError("Failed to create placement");
    } finally {
      setUpdatingId(null);
    }
  };
 
  const stages = ["screening", "shortlisted", "interview-scheduled", "offered", "placed", "rejected"] as const;
  const stageOrder = { screening: 0, shortlisted: 1, "interview-scheduled": 2, offered: 3, placed: 4, rejected: 5 };
 
  const grouped = submissions.reduce((acc, s) => {
    const stage = s.status === "submitted" ? "screening" : s.status;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(s);
    return acc;
  }, {} as Record<string, CandidateSubmission[]>);
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#fafafa]">Recruitment Pipeline</h2>
          <p className="text-sm text-[#a1a1aa]">Drag candidates through stages — only valid transitions allowed</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a]">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
 
      {error && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444] mb-4">
          {error}
        </div>
      )}
 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const subs = grouped[stage] || [];
          const nextStage = nextSubmissionStage(stage);
          return (
            <div key={stage} className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#fafafa] capitalize">{submissionStageLabel(stage)}</h3>
                <span className="text-xs font-medium px-2 py-1 bg-[#27272a] text-[#a1a1aa] rounded-full">{subs.length}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                {subs.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-[#18181b] rounded-lg p-3 border border-[#27272a] hover:border-[#a78bfa]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#fafafa] truncate">{sub.candidate.name}</p>
                        <p className="text-xs text-[#a1a1aa] truncate">{sub.jobRequisition.title}</p>
                        <p className="text-xs text-[#a1a1aa] truncate">{sub.jobRequisition.client.name}</p>
                        {sub.feedback && (
                          <p className="text-xs text-[#a1a1aa] mt-1 italic truncate">{sub.feedback}</p>
                        )}
                        {sub.interviewDate && (
                          <p className="text-xs text-[#a78bfa] mt-1">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {new Date(sub.interviewDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      {(() => {
                        const next = nextSubmissionStage(stage);
                        if (!next) return <span className="text-xs text-[#a1a1aa] text-center py-1">Terminal stage</span>;
 
                        if (stage === "screening") {
                          return (
                            <button
                              onClick={() => handleAdvance(sub)}
                              disabled={updatingId === sub.id}
                              className="text-xs py-1 px-2 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              {updatingId === sub.id ? "..." : "→ Shortlist"}
                            </button>
                          );
                        }
                        if (stage === "shortlisted") {
                          return (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleAdvance(sub)}
                                disabled={updatingId === sub.id}
                                className="text-xs py-1 px-2 bg-[#a855f7]/10 text-[#a855f7] rounded hover:bg-purple-200 disabled:opacity-50"
                              >
                                {updatingId === sub.id ? "..." : "→ Schedule Interview"}
                              </button>
                              <input
                                type="datetime-local"
                                onChange={(e) => handleScheduleInterview(sub, e.target.value)}
                                disabled={updatingId === sub.id}
                                className="text-xs px-2 py-1 border border-[#27272a] rounded"
                              />
                            </div>
                          );
                        }
                        if (stage === "interview-scheduled") {
                          return (
                            <button
                              onClick={() => handleAdvance(sub)}
                              disabled={updatingId === sub.id}
                              className="text-xs py-1 px-2 bg-indigo-100 text-[#a78bfa] rounded hover:bg-indigo-200 disabled:opacity-50"
                            >
                              {updatingId === sub.id ? "..." : "→ Make Offer"}
                            </button>
                          );
                        }
                        if (stage === "offered") {
                          return (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handlePlace(sub)}
                                disabled={updatingId === sub.id}
                                className="text-xs py-1 px-2 bg-[#22c55e]/10 text-[#22c55e] rounded hover:bg-green-200 disabled:opacity-50"
                              >
                                {updatingId === sub.id ? "..." : "→ Place"}
                              </button>
                              <button
                                onClick={() => handleReject(sub)}
                                disabled={updatingId === sub.id}
                                className="text-xs py-1 px-2 bg-[#ef4444]/10 text-[#ef4444] rounded hover:bg-red-200 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          );
                        }
                        if (stage === "placed") {
                          return (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleReject(sub)}
                                disabled={updatingId === sub.id}
                                className="text-xs py-1 px-2 bg-[#ef4444]/10 text-[#ef4444] rounded hover:bg-red-200 disabled:opacity-50"
                              >
                                Unplace / Reject
                              </button>
                            </div>
                          );
                        }
                        return <button disabled className="text-xs py-1 px-2 bg-[#27272a] text-[#a1a1aa] rounded">Reject</button>;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              {subs.length === 0 && (
                <p className="text-xs text-[#a1a1aa] text-center py-4">No candidates</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
 
function PlacementsTab({ placements, onRefresh }: { placements: PlacementRecord[]; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ commissionRate: string; commissionAmount: string; status: string }>({
    commissionRate: "",
    commissionAmount: "",
    status: "",
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleEditClick = (placement: PlacementRecord) => {
    setEditingId(placement.id);
    setEditData({
      commissionRate: placement.commissionRate?.toString() || "",
      commissionAmount: placement.commissionAmount?.toString() || "",
      status: placement.status,
    });
    setError("");
  };

  const handleSave = async (placement: PlacementRecord) => {
    setSavingId(placement.id);
    setError("");
    try {
      const res = await fetch(`/api/agency/placements/${placement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          commissionRate: editData.commissionRate ? Number(editData.commissionRate) : undefined,
          commissionAmount: editData.commissionAmount ? Number(editData.commissionAmount) : undefined,
          status: editData.status,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to update");
        return;
      }
      setEditingId(null);
      onRefresh();
    } catch (e) {
      setError("Failed to update placement");
    } finally {
      setSavingId(null);
    }
  };

  const handleReject = async (placement: PlacementRecord) => {
    if (!confirm("Reject this placement? This will mark the candidate as rejected and unplace them.")) return;
    setSavingId(placement.id);
    setError("");
    try {
      const res = await fetch(`/api/agency/placements/${placement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: "rejected" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to reject placement");
        return;
      }
      onRefresh();
    } catch (e) {
      setError("Failed to reject placement");
    } finally {
      setSavingId(null);
    }
  };

  const renderCommissionCell = (placement: PlacementRecord) => {
    if (editingId === placement.id) {
      return (
        <div className="flex flex-col gap-1">
          <input
            type="number"
            placeholder="Rate %"
            value={editData.commissionRate}
            onChange={(e) => setEditData({ ...editData, commissionRate: e.target.value })}
            className="text-xs px-2 py-1 border border-[#27272a] rounded w-20"
          />
          <input
            type="number"
            placeholder="Amount"
            value={editData.commissionAmount}
            onChange={(e) => setEditData({ ...editData, commissionAmount: e.target.value })}
            className="text-xs px-2 py-1 border border-[#27272a] rounded w-20"
          />
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            className="text-xs px-2 py-1 border border-[#27272a] rounded"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      );
    }
    return (
      <div>
        <p className="text-sm text-[#fafafa]">
          {placement.commissionAmount ? `₹${placement.commissionAmount.toLocaleString()}` : "—"}
          {placement.commissionRate && ` (${placement.commissionRate}%)`}
        </p>
        {placement.status === "active" && (
          <button
            onClick={() => handleReject(placement)}
            disabled={savingId === placement.id}
            className="text-xs mt-1 text-[#ef4444] hover:underline"
          >
            Reject
          </button>
        )}
      </div>
    );
  };

  if (placements.length === 0) {
    return (
      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6">
        <p className="text-[#a1a1aa] text-center py-8">Placements will appear here once candidates are placed with clients.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden">
      <div className="p-6 border-b border-[#27272a] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#fafafa]">Placements ({placements.length})</h2>
        <button onClick={onRefresh} className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a]">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444]">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#27272a]">
          <thead className="bg-[#18181b]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[#18181b] divide-y divide-[#27272a]">
            {placements.map((placement) => (
              <tr key={placement.id} className="hover:bg-[#27272a]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-[#fafafa]">{placement.candidate.name}</p>
                    <p className="text-sm text-[#a1a1aa]">{placement.candidate.email || "—"}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-medium text-[#fafafa]">{placement.client.name}</p>
                  <p className="text-sm text-[#a1a1aa]">{placement.client.industry || "—"}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#fafafa]">
                  {placement.jobRequisition?.title || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#fafafa]">
                  {new Date(placement.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#fafafa]">
                  {placement.salary ? `₹${placement.salary.toLocaleString()}` : "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderCommissionCell(placement)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === placement.id ? (
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="text-xs px-2 py-1 border border-[#27272a] rounded"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      placement.status === "active" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                      placement.status === "completed" ? "bg-[#3b82f6]/10 text-[#3b82f6]" :
                      "bg-[#27272a] text-[#a1a1aa]"
                    }`}>
                      {placement.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a1a1aa]">
                  {new Date(placement.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === placement.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSave(placement)}
                        disabled={savingId === placement.id}
                        className="text-xs px-2 py-1 bg-[#a78bfa] text-white rounded hover:bg-[#8b5cf6] disabled:opacity-50"
                      >
                        {savingId === placement.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-2 py-1 border border-[#27272a] rounded text-[#a1a1aa] hover:bg-[#27272a]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(placement)}
                      className="text-xs text-[#a78bfa] hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
               </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Screening Tab
// ─────────────────────────────────────────────────────────────────────────────

interface ScreeningResult {
  candidateId: string;
  candidateName: string;
  verdict: string;
  matchScore: number;
  scores: Record<string, number>;
  mustHaveBreakdown: Array<{ skill: string; found: string; evidence: string; confidence: string }>;
  niceToHaveBreakdown: Array<{ skill: string; found: string; evidence: string; confidence: string }>;
  redFlags: string[];
  domainFit: string;
  interviewPrediction: string;
  finalRecommendation: string;
}

interface ScreeningSummary {
  total: number;
  strongSubmit: number;
  submitWithCaution: number;
  doNotSubmit: number;
}

interface ClientJDOption {
  key: string;
  client: string;
  job_title: string;
}

function ScreeningTab({ token, candidates }: { token: string | null; candidates: Candidate[] }) {
  const [jdOptions, setJdOptions] = useState<ClientJDOption[]>([]);
  const [selectedJdKey, setSelectedJdKey] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [summary, setSummary] = useState<ScreeningSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [jdLoading, setJdLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const fetchJdOptions = async () => {
    setJdLoading(true);
    try {
      const res = await fetch("/api/agency/client-jds", { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) {
        setJdOptions(data.jds?.map((jd: { id: string; clientName: string; jobTitle: string }) => ({
          key: jd.id,
          client: jd.clientName,
          job_title: jd.jobTitle,
        })) || []);
      }
    } catch (err) {
      console.error("Failed to fetch JD options:", err);
    } finally {
      setJdLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchJdOptions);
  }, []);

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const filtered = filteredCandidates();
    if (selectedCandidates.size === filtered.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filtered.map((c) => c.id)));
    }
  };

  const filteredCandidates = () => {
    return candidates.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.currentRole?.toLowerCase().includes(q) ||
        c.currentCompany?.toLowerCase().includes(q) ||
        c.skills?.toLowerCase().includes(q)
      );
    });
  };

  const handleScreen = async (bulk = false) => {
    if (!selectedJdKey) return;
    const ids = bulk ? candidates.map((c) => c.id) : Array.from(selectedCandidates);
    if (ids.length === 0) return;

    setLoading(true);
    setScreeningResults([]);
    setSummary(null);

    try {
      const res = await fetch("/api/agency/screen/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ jd_id: selectedJdKey, candidateIds: ids }),
      });
      const data = await res.json();
      if (data.success) {
        setScreeningResults(data.results || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Screening failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes("strong")) return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30";
    if (v.includes("caution")) return "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30";
    return "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30";
  };

  const verdictIcon = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes("strong")) return <CheckCircle className="h-5 w-5 text-[#10b981]" />;
    if (v.includes("caution")) return <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />;
    return <XCircle className="h-5 w-5 text-[#ef4444]" />;
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-[#10b981]";
    if (score >= 50) return "text-[#f59e0b]";
    return "text-[#ef4444]";
  };

  const filtered = filteredCandidates();

  return (
    <div className="space-y-6">
      {/* Header + JD Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#fafafa] flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#a78bfa]" />
            AI Candidate Screening
          </h3>
          <p className="text-sm text-[#a1a1aa]">Screen candidates against client job descriptions using AI</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedJdKey}
            onChange={(e) => setSelectedJdKey(e.target.value)}
            disabled={jdLoading}
            className="px-4 py-2 border border-[#27272a] rounded-lg focus:ring-2 focus:ring-[#a78bfa] text-sm"
          >
            <option value="">{jdLoading ? "Loading JDs..." : "Select Client JD"}</option>
            {jdOptions.map((jd) => (
              <option key={jd.key} value={jd.key}>
                {jd.client} — {jd.job_title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-4 text-center">
            <p className="text-2xl font-bold text-[#fafafa]">{summary.total}</p>
            <p className="text-xs text-[#a1a1aa]">Total Screened</p>
          </div>
          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#10b981]/30 p-4 text-center">
            <p className="text-2xl font-bold text-[#10b981]">{summary.strongSubmit}</p>
            <p className="text-xs text-[#10b981]">Strong Submit</p>
          </div>
          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#f59e0b]/30 p-4 text-center">
            <p className="text-2xl font-bold text-[#f59e0b]">{summary.submitWithCaution}</p>
            <p className="text-xs text-[#f59e0b]">Submit with Caution</p>
          </div>
          <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#ef4444]/30 p-4 text-center">
            <p className="text-2xl font-bold text-[#ef4444]">{summary.doNotSubmit}</p>
            <p className="text-xs text-[#ef4444]">Do Not Submit</p>
          </div>
        </div>
      )}

      {/* Candidate Selection + Actions */}
      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a]">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[#27272a] rounded-lg text-sm focus:ring-2 focus:ring-[#a78bfa]"
              />
            </div>
            <span className="text-sm text-[#a1a1aa]">
              {selectedCandidates.size} of {filtered.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAll}
              className="px-3 py-2 text-sm border border-[#27272a] rounded-lg hover:bg-[#27272a]"
            >
              {selectedCandidates.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={() => handleScreen(false)}
              disabled={loading || !selectedJdKey || selectedCandidates.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#a78bfa] text-white rounded-lg hover:bg-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Brain className="h-4 w-4" />
              {loading ? "Screening..." : `Screen Selected (${selectedCandidates.size})`}
            </button>
            <button
              onClick={() => handleScreen(true)}
              disabled={loading || !selectedJdKey}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Send className="h-4 w-4" />
              {loading ? "Screening..." : "Bulk Screen All"}
            </button>
          </div>
        </div>

        {/* Candidate List */}
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#a1a1aa]">No candidates found</div>
          ) : (
            filtered.map((c) => (
              <label
                key={c.id}
                className={`flex items-center gap-4 px-4 py-3 border-b border-[#27272a] cursor-pointer hover:bg-[#27272a] ${
                  selectedCandidates.has(c.id) ? "bg-[#a78bfa]/10" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCandidates.has(c.id)}
                  onChange={() => toggleCandidate(c.id)}
                  className="h-4 w-4 text-[#a78bfa] rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#fafafa]">{c.name}</span>
                    {c.currentRole && (
                      <span className="text-xs text-[#a1a1aa]">• {c.currentRole}</span>
                    )}
                    {c.currentCompany && (
                      <span className="text-xs text-[#a1a1aa]">at {c.currentCompany}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.totalExperience && (
                      <span className="text-xs bg-[#3b82f6]/10 text-[#3b82f6] px-2 py-0.5 rounded-full">
                        {c.totalExperience}yr
                      </span>
                    )}
                    {c.skills && (
                      <span className="text-xs text-[#a1a1aa] truncate max-w-md">{c.skills}</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  c.status === "active" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#27272a] text-[#a1a1aa]"
                }`}>
                  {c.status}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[#a78bfa]">
            <div className="h-5 w-5 border-2 border-[#a78bfa] border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">AI is screening candidates...</span>
          </div>
        </div>
      )}

      {/* Screening Results */}
      {!loading && screeningResults.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-[#fafafa] flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Screening Results
          </h4>
          {screeningResults.map((r) => (
            <div
              key={r.candidateId}
              className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden"
            >
              {/* Result Header */}
              <div
                className="p-4 cursor-pointer hover:bg-[#27272a]"
                onClick={() => setExpandedResult(expandedResult === r.candidateId ? null : r.candidateId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {verdictIcon(r.verdict)}
                    <div>
                      <span className="font-medium text-[#fafafa]">{r.candidateName}</span>
                      <span className="mx-2 text-[#a1a1aa]">—</span>
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded border ${verdictColor(r.verdict)}`}>
                        {r.verdict}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${scoreColor(r.matchScore)}`}>
                      {r.matchScore}/100
                    </span>
                    <Eye className="h-4 w-4 text-[#a1a1aa]" />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedResult === r.candidateId && (
                <div className="px-4 pb-4 border-t border-[#27272a] pt-4 space-y-4">
                  {/* Must-Have Skills */}
                  <div>
                    <h5 className="text-xs font-semibold text-[#a1a1aa] mb-2">Must-Have Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(r.mustHaveBreakdown) ? r.mustHaveBreakdown : []).map((item: { skill: string; found: string }) => (
                        <span
                          key={item.skill}
                          className={`text-xs px-2 py-1 rounded-full border ${
                            item.found?.toLowerCase() === "yes"
                              ? "bg-emerald-50 text-[#10b981] border-[#10b981]/30"
                              : item.found?.toLowerCase() === "partial"
                              ? "bg-yellow-50 text-[#f59e0b] border-[#f59e0b]/30"
                              : "bg-red-50 text-[#ef4444] border-[#ef4444]/30"
                          }`}
                        >
                          {item.skill}: {item.found}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Nice-to-Have Skills */}
                  {(Array.isArray(r.niceToHaveBreakdown) ? r.niceToHaveBreakdown : []).length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-[#a1a1aa] mb-2">Nice-to-Have Skills</h5>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(r.niceToHaveBreakdown) ? r.niceToHaveBreakdown : []).map((item: { skill: string; found: string }) => (
                          <span
                            key={item.skill}
                            className={`text-xs px-2 py-1 rounded-full border ${
                              item.found?.toLowerCase() === "yes"
                                ? "bg-blue-50 text-[#3b82f6] border-[#3b82f6]/30"
                                : "bg-[#18181b] text-[#a1a1aa] border-[#27272a]"
                            }`}
                          >
                            {item.skill}: {item.found}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Red Flags */}
                  {r.redFlags && r.redFlags.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-[#ef4444] uppercase mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Red Flags
                      </h5>
                      <ul className="space-y-1">
                        {r.redFlags.map((flag, i) => (
                          <li key={i} className="text-sm text-[#ef4444] flex items-start gap-2">
                            <span className="text-[#ef4444] mt-0.5">•</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Domain Fit + Interview Prediction + Final Recommendation */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="bg-[#18181b] rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-[#a1a1aa] mb-1">Domain Fit</h5>
                      <p className="text-sm text-[#a1a1aa]">{r.domainFit}</p>
                    </div>
                    <div className="bg-[#18181b] rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-[#a1a1aa] mb-1">Interview Prediction</h5>
                      <p className="text-sm text-[#a1a1aa]">{r.interviewPrediction}</p>
                    </div>
                    <div className="bg-[#18181b] rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-[#a1a1aa] mb-1">Final Recommendation</h5>
                      <p className="text-sm text-[#a1a1aa]">{r.finalRecommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && screeningResults.length === 0 && (
        <div className="text-center py-12 text-[#a1a1aa]">
          <Brain className="h-12 w-12 mx-auto mb-3 text-[#a1a1aa]" />
          <p className="font-medium">No screening results yet</p>
          <p className="text-sm mt-1">Select a client JD and candidates, then click Screen</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Client JDs Tab
// ─────────────────────────────────────────────────────────────────────────────

interface ClientJD {
  id: string;
  clientId: string;
  clientName: string;
  organizationId: string;
  jobTitle: string;
  fullJd: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  experienceMin: number | null;
  experienceMax: number | null;
  mandatoryRequirements: string[];
  domainRequirements: string[];
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

function ClientJDsTab({ token, clients, onRefresh }: { token: string | null; clients: Client[]; onRefresh: () => void }) {
  const [jds, setJds] = useState<ClientJD[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJd, setEditingJd] = useState<ClientJD | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchJds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/client-jds", { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) setJds(data.jds || []);
      else setError(data.error || "Failed to fetch JDs");
    } catch (err) {
      console.error("Failed to fetch JDs:", err);
      setError("Failed to fetch JDs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchJds);
  }, []);

  const handleDelete = async (jd: ClientJD) => {
    if (!confirm(`Delete "${jd.jobTitle}"?`)) return;
    try {
      const res = await fetch("/api/agency/client-jds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: jd.id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchJds();
        onRefresh();
      } else {
        setError(data.error || "Failed to delete JD");
      }
    } catch (err) {
      setError("Failed to delete JD");
    }
  };

  const filteredJds = jds.filter((jd) => {
    const q = search.toLowerCase();
    return (
      jd.clientName?.toLowerCase().includes(q) ||
      jd.jobTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search JDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-[#27272a] rounded-lg focus:ring-2 focus:ring-[#a78bfa]"
          />
        </div>
        <button
          onClick={() => { setEditingJd(null); setShowForm(true); }}
          disabled={clients.length === 0}
          title={clients.length === 0 ? "Add a client before creating a JD" : undefined}
          className="flex items-center gap-2 px-4 py-2 bg-[#a78bfa] text-white rounded-lg hover:bg-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Add Client JD
        </button>
      </div>

      {clients.length === 0 && (
        <div className="rounded-lg border border-[#f59e0b]/30 bg-amber-50 px-4 py-3 text-sm text-[#f59e0b]">
          Add a client first, then create job descriptions for that client.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[#a78bfa]">
            <div className="h-5 w-5 border-2 border-[#a78bfa] border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Loading JDs...</span>
          </div>
        </div>
      ) : (
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden">
          <table className="min-w-full divide-y divide-[#27272a]">
            <thead className="bg-[#18181b]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Job Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Must-Have Skills</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Experience Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredJds.map((jd) => (
                <tr key={jd.id} className="hover:bg-[#27272a]">
                  <td className="px-6 py-4 text-sm font-medium text-[#fafafa]">{jd.clientName}</td>
                  <td className="px-6 py-4 text-sm text-[#fafafa]">{jd.jobTitle}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {jd.mustHaveSkills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#a78bfa]/10 text-[#a78bfa] text-xs rounded">
                          {skill}
                        </span>
                      ))}
                      {(jd.mustHaveSkills?.length || 0) > 3 && (
                        <span className="px-2 py-0.5 bg-[#27272a] text-[#a1a1aa] text-xs rounded">
                          +{jd.mustHaveSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                    {jd.experienceMin != null && jd.experienceMax != null
                      ? `${jd.experienceMin}–${jd.experienceMax} yrs`
                      : jd.experienceMin != null
                      ? `${jd.experienceMin}+ yrs`
                      : jd.experienceMax != null
                      ? `Up to ${jd.experienceMax} yrs`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                    {jd.createdAt ? new Date(jd.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingJd(jd); setShowForm(true); }}
                        className="text-[#a1a1aa] hover:text-[#a78bfa]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(jd)}
                        className="text-[#a1a1aa] hover:text-[#ef4444]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredJds.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#a1a1aa]">
                    No client JDs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ClientJDForm
          token={token}
          clients={clients}
          jd={editingJd}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchJds(); onRefresh(); }}
        />
      )}
    </div>
  );
}

function ClientJDForm({ token, clients, jd, onClose, onSaved }: { token: string | null; clients: Client[]; jd: ClientJD | null; onClose: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState({
    clientId: jd?.clientId || clients[0]?.id || "",
    jobTitle: jd?.jobTitle || "",
    fullJd: jd?.fullJd || "",
    mustHaveSkills: jd?.mustHaveSkills?.join(", ") || "",
    niceToHaveSkills: jd?.niceToHaveSkills?.join(", ") || "",
    experienceMin: jd?.experienceMin?.toString() || "",
    experienceMax: jd?.experienceMax?.toString() || "",
    mandatoryRequirements: jd?.mandatoryRequirements?.join(", ") || "",
    domainRequirements: jd?.domainRequirements?.join(", ") || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const body = {
        ...(jd ? { id: jd.id } : {}),
        clientId: formData.clientId,
        jobTitle: formData.jobTitle,
        fullJd: formData.fullJd,
        mustHaveSkills: formData.mustHaveSkills.split(",").map((s) => s.trim()).filter(Boolean),
        niceToHaveSkills: formData.niceToHaveSkills.split(",").map((s) => s.trim()).filter(Boolean),
        experienceMin: formData.experienceMin ? Number(formData.experienceMin) : null,
        experienceMax: formData.experienceMax ? Number(formData.experienceMax) : null,
        mandatoryRequirements: formData.mandatoryRequirements.split(",").map((s) => s.trim()).filter(Boolean),
        domainRequirements: formData.domainRequirements.split(",").map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch("/api/agency/client-jds", {
        method: jd ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.error || "Failed to save JD");
      }
    } catch (err) {
      console.error("Save JD error:", err);
      setError("Failed to save JD. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#18181b] rounded-xl shadow-xl border border-[#27272a] max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#27272a]">
          <h2 className="text-lg font-semibold">{jd ? "Edit Client JD" : "Add Client JD"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444]">
              {error}
            </div>
          )}
          <label className="text-sm font-medium text-[#a1a1aa]">
            Client *
            <select
              value={formData.clientId}
              onChange={(e) => updateField("clientId", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-[#a1a1aa]">
            Job Title *
            <input
              value={formData.jobTitle}
              onChange={(e) => updateField("jobTitle", e.target.value)}
              placeholder="Senior Java Developer"
              className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm font-medium text-[#a1a1aa]">
            Full JD *
            <textarea
              value={formData.fullJd}
              onChange={(e) => updateField("fullJd", e.target.value)}
              rows={5}
              placeholder="Paste the full job description here..."
              className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
              required
            />
          </label>
          <label className="text-sm font-medium text-[#a1a1aa]">
            Must-Have Skills (comma-separated)
            <input
              value={formData.mustHaveSkills}
              onChange={(e) => updateField("mustHaveSkills", e.target.value)}
              placeholder="Java, Spring Boot, SQL"
              className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-[#a1a1aa]">
            Nice-to-Have Skills (comma-separated)
            <input
              value={formData.niceToHaveSkills}
              onChange={(e) => updateField("niceToHaveSkills", e.target.value)}
              placeholder="Docker, Kubernetes, AWS"
              className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-[#a1a1aa]">
              Min Experience (years)
              <input
                type="number"
                min="0"
                value={formData.experienceMin}
                onChange={(e) => updateField("experienceMin", e.target.value)}
                placeholder="3"
                className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-[#a1a1aa]">
              Max Experience (years)
              <input
                type="number"
                min="0"
                value={formData.experienceMax}
                onChange={(e) => updateField("experienceMax", e.target.value)}
                placeholder="8"
                className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-[#a1a1aa]">
            Mandatory Requirements (comma-separated)
            <input
              value={formData.mandatoryRequirements}
              onChange={(e) => updateField("mandatoryRequirements", e.target.value)}
              placeholder="Bachelor's degree, 3+ years experience"
              className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-[#a1a1aa]">
            Domain Requirements (comma-separated)
            <input
              value={formData.domainRequirements}
              onChange={(e) => updateField("domainRequirements", e.target.value)}
              placeholder="Banking, Financial Services, Insurance"
              className="mt-1 w-full rounded-lg border border-[#27272a] px-3 py-2"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#a78bfa] text-white rounded-lg hover:bg-[#8b5cf6]">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interviews Tab
// ─────────────────────────────────────────────────────────────────────────────

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateSkills: string | null;
  format: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number;
  overallScore: number;
  aiSummary: string | null;
  aiRecommendation: string | null;
  createdAt: string | null;
}

function InterviewsTab({ token, candidates }: { token: string | null; candidates: Candidate[] }) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchInterviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interviews", { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) {
        setInterviews(data.interviews || []);
      } else {
        setError(data.error || "Failed to fetch interviews");
      }
    } catch (err) {
      console.error("Failed to fetch interviews:", err);
      setError("Failed to fetch interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchInterviews);
  }, []);

  const filteredInterviews = interviews.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.candidateName.toLowerCase().includes(q) ||
      i.format.toLowerCase().includes(q) ||
      i.status.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-[#f59e0b]/10 text-[#f59e0b]";
      case "in-progress":
        return "bg-[#3b82f6]/10 text-[#3b82f6]";
      case "completed":
        return "bg-[#22c55e]/10 text-[#22c55e]";
      default:
        return "bg-[#27272a] text-[#a1a1aa]";
    }
  };

  const scoreBadge = (score: number) => {
    if (score >= 75) return "bg-[#22c55e]/10 text-[#22c55e]";
    if (score >= 50) return "bg-[#f59e0b]/10 text-[#f59e0b]";
    return "bg-[#ef4444]/10 text-[#ef4444]";
  };

  const recommendationBadge = (rec: string) => {
    switch (rec) {
      case "STRONG HIRE":
        return "bg-[#22c55e]/10 text-[#22c55e]";
      case "HIRE":
        return "bg-[#22c55e]/10 text-[#22c55e]";
      case "MAYBE":
        return "bg-[#f59e0b]/10 text-[#f59e0b]";
      case "NO HIRE":
        return "bg-[#ef4444]/10 text-[#ef4444]";
      default:
        return "bg-[#27272a] text-[#a1a1aa]";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-[#a78bfa]">
          <div className="h-5 w-5 border-2 border-[#a78bfa] border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading interviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search interviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-[#27272a] rounded-lg focus:ring-2 focus:ring-[#a78bfa]"
          />
        </div>
        <button
          onClick={fetchInterviews}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-red-50 px-4 py-3 text-sm text-[#ef4444]">
          {error}
        </div>
      )}

      <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] overflow-hidden">
        <table className="min-w-full divide-y divide-[#27272a]">
          <thead className="bg-[#18181b]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Format</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Recommendation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#a1a1aa]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {filteredInterviews.map((interview) => (
              <tr key={interview.id} className="hover:bg-[#27272a]">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-[#fafafa]">{interview.candidateName}</p>
                    {interview.candidateSkills && (
                      <p className="text-xs text-[#a1a1aa] truncate max-w-xs">{interview.candidateSkills}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-[#a78bfa]">
                    {interview.format}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge(interview.status)}`}>
                    {interview.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {interview.overallScore != null ? (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${scoreBadge(interview.overallScore)}`}>
                      {interview.overallScore}
                    </span>
                  ) : (
                    <span className="text-[#a1a1aa]">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {interview.aiRecommendation ? (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${recommendationBadge(interview.aiRecommendation)}`}>
                      {interview.aiRecommendation}
                    </span>
                  ) : (
                    <span className="text-[#a1a1aa]">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                  {formatDate(interview.completedAt || interview.startedAt || interview.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {interview.status === "completed" && (
                      <a
                        href={`/interview/${interview.id}/results`}
                        className="flex items-center gap-1 rounded-md bg-[#a78bfa]/10 px-2 py-1 text-xs font-medium text-[#a78bfa] hover:bg-[#a78bfa]/20"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Results
                      </a>
                    )}
                    {interview.status === "scheduled" && (
                      <a
                        href={`/interview/setup/${interview.candidateId}`}
                        className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-[#22c55e] hover:bg-[#22c55e]/10"
                      >
                        Start Interview
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredInterviews.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#a1a1aa]">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-[#a1a1aa]" />
                  <p className="font-medium">No interviews found</p>
                  <p className="text-sm mt-1">Interviews will appear here once scheduled</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
