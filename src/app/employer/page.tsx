"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import PostJobModal from "@/components/employer/PostJobModal";
import JobMatchesModal, { type Job } from "@/components/employer/JobMatchesModal";
import { 
  Briefcase, Users, FileCheck, TrendingUp, Search, 
  Plus, ArrowRight, Clock, CheckCircle, AlertCircle,
  Building2, Mail, Phone, MapPin, Download, X,
  Eye, Pause, Play, Trash2
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  appliedDate: string;
  skills: string;
  experience: string;
  location: string;
  education: string;
  evaluationScore: number | null;
  evaluation: string | null;
  videoUrl: string | null;
}

interface ApiCandidate {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  profile: {
    currentRole: string | null;
    totalExperience: string | null;
    currentLocation: string | null;
    skills: string | null;
    education: string | null;
    preferredLocation: string | null;
    workMode: string | null;
  } | null;
  interview: {
    date: string | null;
    time: string | null;
    status: string | null;
    evaluationScore: number | null;
    evaluation: string | null;
    videoUrl: string | null;
    proctoringStatus: string | null;
    proctoringFlags: number | null;
  } | null;
}

function deriveStatus(candidate: ApiCandidate): string {
  const interview = candidate.interview;
  if (!interview || interview.status !== "completed" || interview.evaluationScore === null) {
    return "pending";
  }
  if (interview.evaluationScore >= 8) return "verified";
  if (interview.evaluationScore >= 5) return "shortlisted";
  return "pending";
}

function parseSkills(skills: string | null): string[] {
  if (!skills) return [];
  try {
    const parsed = JSON.parse(skills);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // fall through to comma-split
  }
  return skills.split(",").map((s) => s.trim()).filter(Boolean);
}

function mapCandidate(candidate: ApiCandidate): Candidate {
  return {
    id: candidate.id,
    name: candidate.name || "Unnamed Candidate",
    email: candidate.email,
    phone: candidate.phone || "-",
    role: candidate.profile?.currentRole || "Candidate",
    status: deriveStatus(candidate),
    appliedDate: candidate.createdAt.slice(0, 10),
    skills: parseSkills(candidate.profile?.skills ?? null).join(", "),
    experience: candidate.profile?.totalExperience || "",
    location: candidate.profile?.currentLocation || "-",
    education: candidate.profile?.education || "",
    evaluationScore: candidate.interview?.evaluationScore ?? null,
    evaluation: candidate.interview?.evaluation || null,
    videoUrl: candidate.interview?.videoUrl || null,
  };
}

function exportCandidatesCSV(candidates: Candidate[]) {
  if (candidates.length === 0) return;
  const headers = ["Name", "Role", "Email", "Phone", "Location", "Experience", "Skills", "Status", "Applied Date"];
  const rows = candidates.map((c) => [
    c.name,
    c.role,
    c.email,
    c.phone,
    c.location,
    c.experience,
    c.skills,
    c.status,
    c.appliedDate,
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((val) => {
        const s = String(val);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "candidates.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function formatScore(score: number | null): string {
  if (score === null || score === undefined) return "N/A";
  return `${score.toFixed(1)} / 10`;
}

export default function EmployerDashboard() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [matchesJob, setMatchesJob] = useState<Job | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    shortlisted: 0,
  });

  const loadJobs = useCallback(async (authToken: string) => {
    try {
      const res = await fetch("/api/employer/jobs", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.success) setJobs(data.jobs);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (!isLoading && user && user.role !== "employer" && user.role !== "admin") {
      router.push("/profile");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/employer/candidates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          const mapped = (data.candidates as ApiCandidate[]).map(mapCandidate);
          setCandidates(mapped);
          setStats({
            total: mapped.length,
            pending: mapped.filter((c) => c.status === "pending").length,
            verified: mapped.filter((c) => c.status === "verified").length,
            shortlisted: mapped.filter((c) => c.status === "shortlisted").length,
          });
        }
      } catch (error) {
        console.error("Failed to load candidates:", error);
      } finally {
        if (!cancelled) setLoadingCandidates(false);
      }
    })();

    (async () => {
      await loadJobs(token);
    })();

    return () => { cancelled = true; };
  }, [token, user, router, loadJobs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "shortlisted":
        return "bg-blue-100 text-blue-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "shortlisted":
        return <TrendingUp className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const jobStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      paused: "bg-yellow-100 text-yellow-700",
      closed: "bg-gray-100 text-gray-600",
      draft: "bg-blue-100 text-blue-700",
    };
    return styles[status] || "bg-gray-100 text-gray-600";
  };

  const handleJobStatus = async (job: Job, newStatus: string) => {
    try {
      const res = await fetch(`/api/employer/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update job");
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)));
      toast.success(newStatus === "active" ? "Job reactivated" : `Job ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update job");
    }
  };

  const handleDeleteJob = async (job: Job) => {
    if (!window.confirm(`Delete the job "${job.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/employer/jobs/${job.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete job");
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success("Job deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete job");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome back, {user.name || "Employer"}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900"
              >
                Home
              </Link>
              <button
                onClick={() => setShowPostModal(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Post Job
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Shortlisted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.shortlisted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates by name, skills, or location..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <select className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
              <option>All Status</option>
              <option>Pending</option>
              <option>Verified</option>
              <option>Shortlisted</option>
            </select>
            <select className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
              <option>All Locations</option>
              <option>Bangalore</option>
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>Hyderabad</option>
            </select>
          </div>
        </div>

        {/* Posted Jobs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Posted Jobs</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage openings and view AI-matched candidates for each role
              </p>
            </div>
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Job
            </button>
          </div>
          {loadingJobs ? (
            <div className="p-10 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500">No jobs posted yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Click &quot;Post Job&quot; to create your first opening and get AI-matched candidates.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => (
                <div key={job.id} className="p-6 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${jobStatusBadge(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {[job.department, job.location, job.experienceLevel, job.employmentType].filter(Boolean).join(" · ") || "No location specified"}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{job.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setMatchesJob(job)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                      title="View AI-matched candidates"
                    >
                      <Eye className="w-4 h-4" />
                      Matches
                    </button>
                    {job.status === "active" ? (
                      <button
                        onClick={() => handleJobStatus(job, "paused")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Pause job"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      job.status !== "closed" && (
                        <button
                          onClick={() => handleJobStatus(job, "active")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Activate job"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )
                    )}
                    <button
                      onClick={() => handleDeleteJob(job)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Candidates List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
            <button
              onClick={() => exportCandidatesCSV(candidates)}
              disabled={candidates.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          {loadingCandidates ? (
            <div className="p-10 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500">No candidates yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Candidates who sign up and complete their profile will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {candidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate)}
                className="w-full text-left p-6 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {candidate.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                      <p className="text-sm text-gray-500">{candidate.role}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {candidate.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {candidate.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {candidate.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-500">Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.split(", ").map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(
                        candidate.status
                      )}`}
                    >
                      {getStatusIcon(candidate.status)}
                      {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                    </span>
                    {candidate.evaluationScore !== null && (
                      <span className="text-sm font-semibold text-gray-700">
                        {formatScore(candidate.evaluationScore)}
                      </span>
                    )}
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>
            ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/enterprise"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Enterprise Solutions</h3>
                <p className="text-sm text-gray-500">Scale your hiring process</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
                <p className="text-sm text-gray-500">View all candidates</p>
              </div>
            </div>
          </Link>

          <Link
            href="/government"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Government Solutions</h3>
                <p className="text-sm text-gray-500">Public sector hiring</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4"
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {selectedCandidate.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-sm text-gray-500">{selectedCandidate.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(
                    selectedCandidate.status
                  )}`}
                >
                  {getStatusIcon(selectedCandidate.status)}
                  {selectedCandidate.status.charAt(0).toUpperCase() + selectedCandidate.status.slice(1)}
                </span>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {selectedCandidate.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {selectedCandidate.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {selectedCandidate.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {selectedCandidate.experience || "Experience not specified"}
                </div>
              </div>

              {selectedCandidate.education && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Education</h4>
                  <p className="text-sm text-gray-600">{selectedCandidate.education}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills</h4>
                {selectedCandidate.skills ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.split(", ").map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No skills listed yet.</p>
                )}
              </div>

              {/* Interview score */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Interview Score</h4>
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${
                      selectedCandidate.evaluationScore !== null && selectedCandidate.evaluationScore >= 8
                        ? "bg-green-100 text-green-700"
                        : selectedCandidate.evaluationScore !== null && selectedCandidate.evaluationScore >= 5
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {formatScore(selectedCandidate.evaluationScore)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>{selectedCandidate.status === "verified" ? "Top performer — recommended for hire" : selectedCandidate.status === "shortlisted" ? "Strong candidate — worth shortlisting" : "Interview pending or not yet evaluated"}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedCandidate.evaluationScore !== null && selectedCandidate.evaluationScore >= 8
                            ? "bg-green-500"
                            : selectedCandidate.evaluationScore !== null && selectedCandidate.evaluationScore >= 5
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                        }`}
                        style={{
                          width: `${selectedCandidate.evaluationScore !== null ? selectedCandidate.evaluationScore * 10 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Evaluation */}
              {selectedCandidate.evaluation && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Evaluation</h4>
                  <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                    {selectedCandidate.evaluation}
                  </div>
                </div>
              )}

              {/* Interview video */}
              {selectedCandidate.videoUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Interview Recording</h4>
                  <video src={selectedCandidate.videoUrl} controls className="w-full rounded-xl bg-black" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PostJobModal
        open={showPostModal}
        token={token}
        onClose={() => setShowPostModal(false)}
        onCreated={() => token && loadJobs(token)}
      />
      {matchesJob && (
        <JobMatchesModal
          key={matchesJob.id}
          job={matchesJob}
          token={token}
          onClose={() => setMatchesJob(null)}
        />
      )}
    </div>
  );
}
