"use client";

import { useState } from "react";
import { X, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

interface PostJobModalProps {
  open: boolean;
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}

const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"];
const EXPERIENCE_LEVELS = ["junior", "mid", "senior", "lead", "executive"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD", "AUD"];

const initialForm = {
  title: "",
  description: "",
  department: "",
  location: "",
  employmentType: "",
  experienceLevel: "",
  salaryMin: "",
  salaryMax: "",
  currency: "INR",
  requiredSkills: "",
  preferredSkills: "",
  status: "active",
};

export default function PostJobModal({ open, token, onClose, onCreated }: PostJobModalProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const update = (key: keyof typeof initialForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a job title");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post job");

      toast.success("Job posted successfully");
      setForm(initialForm);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Post a Job</h2>
              <p className="text-sm text-gray-500">Create a job opening and get AI-matched candidates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Job Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className={inputClass}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={5}
                placeholder="Describe the role, responsibilities, and requirements..."
                className={`${inputClass} resize-none`}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                placeholder="e.g. Engineering"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Bangalore (Hybrid)"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Employment Type</label>
              <select
                value={form.employmentType}
                onChange={(e) => update("employmentType", e.target.value)}
                className={inputClass}
              >
                <option value="">Select type</option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace("-", " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Experience Level</label>
              <select
                value={form.experienceLevel}
                onChange={(e) => update("experienceLevel", e.target.value)}
                className={inputClass}
              >
                <option value="">Select level</option>
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Min Salary</label>
              <input
                type="number"
                min="0"
                value={form.salaryMin}
                onChange={(e) => update("salaryMin", e.target.value)}
                placeholder="e.g. 1500000"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Max Salary</label>
              <input
                type="number"
                min="0"
                value={form.salaryMax}
                onChange={(e) => update("salaryMax", e.target.value)}
                placeholder="e.g. 2500000"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Currency</label>
              <select
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
                className={inputClass}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Required Skills</label>
              <input
                type="text"
                value={form.requiredSkills}
                onChange={(e) => update("requiredSkills", e.target.value)}
                placeholder="e.g. React, TypeScript, Node.js"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Preferred Skills</label>
              <input
                type="text"
                value={form.preferredSkills}
                onChange={(e) => update("preferredSkills", e.target.value)}
                placeholder="e.g. PostgreSQL, Docker, AWS"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
