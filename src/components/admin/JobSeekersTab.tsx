"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Download, Eye, Edit, Trash2, Users } from "lucide-react";

interface JobSeekersTabProps {
  token: string | null;
}

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
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
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

export default function JobSeekersTab({ token }: JobSeekersTabProps) {
  const [seekers, setSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/job-seekers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setSeekers(data.jobSeekers);
      } catch (error) {
        console.error("Failed to load job seekers:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Seeker(s)</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all registered job seekers</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">No job seekers found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Skills</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Experience</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Registered</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((seeker, i) => (
                    <tr key={seeker.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * pageSize + i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{seeker.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{seeker.email}</td>
                      <td className="px-4 py-3 text-gray-600">{seeker.phone}</td>
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
                            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">
                              +{seeker.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{seeker.citizenship}</td>
                      <td className="px-4 py-3 text-gray-600">{seeker.experience}</td>
                      <td className="px-4 py-3 text-gray-600">
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
                              ? "bg-green-100 text-green-700"
                              : seeker.interviewStatus === "scheduled"
                              ? "bg-blue-100 text-blue-700"
                              : seeker.profileComplete
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {seeker.interviewStatus || (seeker.profileComplete ? "Ready" : "Pending")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
