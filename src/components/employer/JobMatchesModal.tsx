"use client";

import { useState, useEffect } from "react";
import { X, Users, Sparkles } from "lucide-react";

export interface Job {
  id: string;
  title: string;
  description: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  requiredSkills: string | null;
  preferredSkills: string | null;
  status: string;
  createdAt: string;
}

interface JobMatch {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  currentRole: string | null;
  currentLocation: string | null;
  totalExperience: string | null;
  skills: string | null;
  education: string | null;
  evaluationScore: number | null;
  interviewStatus: string | null;
  similarity: number;
}

interface JobMatchesModalProps {
  job: Job;
  token: string | null;
  onClose: () => void;
}

function similarityColor(sim: number): string {
  if (sim >= 75) return "bg-green-100 text-green-700";
  if (sim >= 55) return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700";
}

function parseSkills(skills: string | null): string[] {
  if (!skills) return [];
  try {
    const parsed = JSON.parse(skills);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // fall through
  }
  return skills.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function JobMatchesModal({ job, token, onClose }: JobMatchesModalProps) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/employer/jobs/${job.id}/matches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Failed to load matches");
          return;
        }
        setMatches(data.matches || []);
      } catch {
        if (!cancelled) setError("Something went wrong. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [job.id, token]);

  const formatSalary = () => {
    if (job.salaryMin == null && job.salaryMax == null) return null;
    const fmt = (n: number) => n.toLocaleString();
    if (job.salaryMin != null && job.salaryMax != null) return `${job.currency} ${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
    if (job.salaryMin != null) return `${job.currency} ${fmt(job.salaryMin)}+`;
    return `${job.currency} up to ${fmt(job.salaryMax!)}`;
  };

  const salary = formatSalary();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
              <p className="text-sm text-gray-500">
                {[job.department, job.location, job.experienceLevel, salary]
                  .filter(Boolean)
                  .join(" · ") || "AI-matched candidates"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-600 text-sm">{error}</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No matching candidates found yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Candidates who complete their profile will be ranked here by AI similarity.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {matches.map((m) => (
                <div key={m.userId} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-primary">{m.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-sm text-gray-500">
                        {[m.currentRole, m.currentLocation, m.totalExperience].filter(Boolean).join(" · ") || "Candidate"}
                      </p>
                      {m.skills && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {parseSkills(m.skills).slice(0, 6).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.email && <p className="text-xs text-gray-400 mt-1.5">{m.email}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${similarityColor(m.similarity)}`}>
                      {m.similarity.toFixed(1)}% match
                    </span>
                    {m.evaluationScore != null && (
                      <span className="text-xs text-gray-500">Interview: {m.evaluationScore.toFixed(1)}/10</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
