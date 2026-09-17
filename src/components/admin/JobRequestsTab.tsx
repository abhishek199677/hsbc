"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Download, Eye, Edit, Users, X, MapPin, Briefcase, Clock, DollarSign } from "lucide-react";

interface JobRequest {
  id: string;
  sl: number;
  jrId: string;
  clientName: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  experienceMin: number | null;
  experienceMax: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  jobType: string;
  status: string;
  priority: string;
  openings: number;
  filledCount: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  applicants: number;
  placements: number;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-[#22c55e]/10 text-[#22c55e]",
  "on-hold": "bg-[#f59e0b]/10 text-[#f59e0b]",
  filled: "bg-[#3b82f6]/10 text-[#3b82f6]",
  cancelled: "bg-[#ef4444]/10 text-[#ef4444]",
};

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

function JobRequestDetailModal({ job, onClose }: { job: JobRequest; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-[#18181b] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#fafafa]">{job.title}</h2>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_COLORS[job.status] || "bg-[#27272a] text-[#a1a1aa]"}`}>
                {job.status}
              </span>
            </div>
            <p className="text-sm text-[#a1a1aa] mt-1">{job.jrId} &middot; {job.clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#a1a1aa] hover:text-[#fafafa] rounded-lg hover:bg-[#27272a] transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[#a1a1aa] text-xs block">Location</span>
                <span className="text-[#fafafa] font-medium">{job.location || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[#a1a1aa] text-xs block">Experience</span>
                <span className="text-[#fafafa] font-medium">
                  {job.experienceMin && job.experienceMax ? `${job.experienceMin}-${job.experienceMax} yrs` : job.experienceMin ? `${job.experienceMin}+ yrs` : "N/A"}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[#a1a1aa] text-xs block">Salary Range</span>
                <span className="text-[#fafafa] font-medium">
                  {job.salaryMin && job.salaryMax ? `${(job.salaryMin / 1000).toFixed(0)}k-${(job.salaryMax / 1000).toFixed(0)}k` : "N/A"}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Clock className="w-4 h-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[#a1a1aa] text-xs block">Job Type</span>
                <span className="text-[#fafafa] font-medium capitalize">{job.jobType || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Users className="w-4 h-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[#a1a1aa] text-xs block">Openings</span>
                <span className="text-[#fafafa] font-medium">{job.openings}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[#a1a1aa] text-xs block">Priority</span>
                <span className="text-[#fafafa] font-medium capitalize">{job.priority || "Normal"}</span>
              </div>
            </div>
          </div>

          {job.description && (
            <div>
              <h4 className="text-sm font-semibold text-[#a1a1aa] mb-1.5">Description</h4>
              <p className="text-sm text-[#a1a1aa] whitespace-pre-line">{job.description}</p>
            </div>
          )}

          {job.requirements && (
            <div>
              <h4 className="text-sm font-semibold text-[#a1a1aa] mb-1.5">Requirements</h4>
              <p className="text-sm text-[#a1a1aa] whitespace-pre-line">{job.requirements}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-[#a1a1aa]">
            <span>Applicants: <span className="font-semibold text-[#3b82f6]">{job.applicants}</span></span>
            <span>Placements: <span className="font-semibold text-[#22c55e]">{job.placements}</span></span>
            {job.deadline && <span>Deadline: <span className="font-medium text-[#fafafa]">{new Date(job.deadline).toLocaleDateString()}</span></span>}
          </div>
        </div>

        <div className="p-6 pt-0 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-[#fafafa] border border-[#27272a] rounded-lg hover:bg-[#27272a] transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobRequestsTab() {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/job-requests");
        const data = await res.json();
        if (data.success) setJobs(data.jobRequests);
      } catch (error) {
        console.error("Failed to load job requests:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = jobs;
    if (statusFilter) {
      result = result.filter((j) => j.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.jrId.toLowerCase().includes(q) ||
          j.title.toLowerCase().includes(q) ||
          j.clientName.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [jobs, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExport = () => {
    const rows = filtered.map((j) => ({
      "JR ID": j.jrId,
      Client: j.clientName,
      "Job Title": j.title,
      Location: j.location,
      Experience: j.experienceMin && j.experienceMax ? `${j.experienceMin}-${j.experienceMax} yrs` : "N/A",
      Status: j.status,
      Openings: j.openings,
      Applicants: j.applicants,
      Created: new Date(j.createdAt).toLocaleDateString(),
    }));
    downloadCSV(rows, "job-requests.csv");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Job Request(s)</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">Manage job requisitions and openings</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-lg hover:bg-[#27272a] transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-[#18181b] rounded-xl border border-[#27272a] p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
            <input
              type="text"
              placeholder="Search by JR ID, title, client, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#27272a] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#27272a] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="on-hold">On Hold</option>
            <option value="filled">Filled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-[#18181b] rounded-xl border border-[#27272a] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#a1a1aa]">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">No job requests found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#18181b] border-b border-[#27272a]">
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa] w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">JR ID</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Job Title</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Exp.</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Openings</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Applicants</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Updated</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {paginated.map((job, i) => (
                    <tr key={job.id} className="hover:bg-[#27272a] transition-colors">
                      <td className="px-4 py-3 text-[#a1a1aa]">{(page - 1) * pageSize + i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-[#3b82f6]">{job.jrId}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#fafafa]">{job.clientName}</td>
                      <td className="px-4 py-3 text-[#a1a1aa]">{job.title}</td>
                      <td className="px-4 py-3 text-[#a1a1aa]">
                        {job.experienceMin && job.experienceMax
                          ? `${job.experienceMin}-${job.experienceMax} Yrs`
                          : job.experienceMin
                          ? `${job.experienceMin}+ Yrs`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-[#a1a1aa]">{job.location}</td>
                      <td className="px-4 py-3 text-[#a1a1aa] text-center">{job.openings}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-[#3b82f6] text-xs font-medium">
                          {job.applicants}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#a1a1aa]">
                        {new Date(job.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${STATUS_COLORS[job.status] || "bg-[#27272a] text-[#a1a1aa]"}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#3b82f6] hover:bg-blue-50 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#f59e0b] hover:bg-amber-50 transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-[#27272a]">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#a1a1aa]">Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-[#27272a] rounded-md px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#a1a1aa]">
                  {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-[#27272a] rounded-md hover:bg-[#27272a] disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border border-[#27272a] rounded-md hover:bg-[#27272a] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedJob && <JobRequestDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
