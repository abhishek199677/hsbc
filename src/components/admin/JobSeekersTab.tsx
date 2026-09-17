"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Download, Eye, Edit, Trash2, Users } from "lucide-react";
import CandidateProfileModal, { type CandidateUser } from "@/components/admin/CandidateProfileModal";

interface JobSeeker {
  id: string;
  sl: number;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  citizenship: string;
  experience: string;
  registrationDate: string;
  interviewStatus: string | null;
  score: number | null;
  profileComplete: boolean;
}

const SKILL_COLORS = [
  "bg-[#3b82f6]/10 text-[#3b82f6]",
  "bg-[#22c55e]/10 text-[#22c55e]",
  "bg-[#a855f7]/10 text-[#a855f7]",
  "bg-[#f59e0b]/10 text-[#f59e0b]",
  "bg-[#f43f5e]/10 text-[#f43f5e]",
  "bg-[#06b6d4]/10 text-[#06b6d4]",
  "bg-indigo-100 text-[#a78bfa]",
  "bg-[#10b981]/10 text-[#10b981]",
];

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

export default function JobSeekersTab() {
  const [seekers, setSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<CandidateUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/job-seekers");
        const data = await res.json();
        if (data.success) setSeekers(data.jobSeekers);
      } catch (error) {
        console.error("Failed to load job seekers:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return seekers;
    const q = search.toLowerCase();
    return seekers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.skills.some((sk) => sk.toLowerCase().includes(q))
    );
  }, [seekers, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExport = () => {
    const rows = filtered.map((s) => ({
      Name: s.name,
      Email: s.email,
      Phone: s.phone,
      Skills: s.skills.join(", "),
      Location: s.citizenship,
      Experience: s.experience,
      "Registration Date": new Date(s.registrationDate).toLocaleDateString(),
      Status: s.interviewStatus || "Pending",
      Score: s.score || "",
    }));
    downloadCSV(rows, "job-seekers.csv");
  };

  const handleView = async (seeker: JobSeeker) => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        const user = data.users.find((u: CandidateUser) => u.id === seeker.id);
        if (user) {
          setSelectedUser(user);
          return;
        }
      }
    } catch {
      // fallback: construct minimal CandidateUser from seeker data
    }
    setSelectedUser({
      id: seeker.id,
      email: seeker.email,
      name: seeker.name,
      phone: seeker.phone,
      createdAt: seeker.registrationDate,
      profile: {
        isComplete: seeker.profileComplete,
        resumeUrl: null,
        resumeFileName: null,
        aboutYou: null,
        whatDrivesYou: null,
        strengths: null,
        currentRole: null,
        totalExperience: seeker.experience,
        currentLocation: seeker.citizenship,
        noticePeriod: null,
        skills: seeker.skills.join(", "),
        currentCompany: null,
        education: null,
        jobType: null,
        salaryRange: null,
        preferredLocation: null,
        workMode: null,
        timezone: null,
        step: null,
      },
      interview: null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa]">Job Seeker(s)</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">Manage all registered job seekers</p>
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
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#27272a] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
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
            <p className="text-sm">No job seekers found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#18181b] border-b border-[#27272a]">
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa] w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Skills</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Experience</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Registered</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-[#a1a1aa]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {paginated.map((seeker, i) => (
                    <tr key={seeker.id} className="hover:bg-[#27272a] transition-colors">
                      <td className="px-4 py-3 text-[#a1a1aa]">{(page - 1) * pageSize + i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#fafafa]">{seeker.name}</span>
                      </td>
                      <td className="px-4 py-3 text-[#a1a1aa]">{seeker.email}</td>
                      <td className="px-4 py-3 text-[#a1a1aa]">{seeker.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {seeker.skills.slice(0, 3).map((skill, si) => (
                            <span
                              key={si}
                              className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${SKILL_COLORS[si % SKILL_COLORS.length]}`}
                            >
                              {skill}
                            </span>
                          ))}
                          {seeker.skills.length > 3 && (
                            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#27272a] text-[#a1a1aa]">
                              +{seeker.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#a1a1aa]">{seeker.citizenship}</td>
                      <td className="px-4 py-3 text-[#a1a1aa]">{seeker.experience}</td>
                      <td className="px-4 py-3 text-[#a1a1aa]">
                        {new Date(seeker.registrationDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            seeker.interviewStatus === "completed"
                              ? "bg-[#22c55e]/10 text-[#22c55e]"
                              : seeker.interviewStatus === "scheduled"
                              ? "bg-[#3b82f6]/10 text-[#3b82f6]"
                              : seeker.profileComplete
                              ? "bg-[#10b981]/10 text-[#10b981]"
                              : "bg-[#27272a] text-[#a1a1aa]"
                          }`}
                        >
                          {seeker.interviewStatus || (seeker.profileComplete ? "Ready" : "Pending")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(seeker)}
                            className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#3b82f6] hover:bg-blue-50 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#f59e0b] hover:bg-amber-50 transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-[#a1a1aa] hover:text-[#ef4444] hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
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

      {selectedUser && (
        <CandidateProfileModal
          key={selectedUser.id}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
