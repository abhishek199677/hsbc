"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import toast from "react-hot-toast";

function getUserFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    const user = getUserFromStorage();
    if (user?.email && !email) setEmail(user.email);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter your feedback");
      return;
    }
    setSubmitting(true);
    try {
      const user = getUserFromStorage();
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: email || user?.email || null,
          userId: user?.id || null,
          page: window.location.pathname,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      toast.success("Feedback submitted! Thank you.");
      setOpen(false);
      setType("general");
      setMessage("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 bg-[#a78bfa] hover:bg-[#8b5cf6] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Send feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-[#27272a]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#fafafa]">Send Feedback</h2>
              <button onClick={() => setOpen(false)} className="text-[#a1a1aa] hover:text-[#fafafa]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-[#27272a] bg-[#27272a] text-[#fafafa] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a78bfa] focus:border-[#a78bfa] outline-none"
                >
                  <option value="general">General</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Tell us what's on your mind..."
                  className="w-full border border-[#27272a] bg-[#27272a] text-[#fafafa] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a78bfa] focus:border-[#a78bfa] outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-[#27272a] bg-[#27272a] text-[#fafafa] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a78bfa] focus:border-[#a78bfa] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#a78bfa] hover:bg-[#8b5cf6] disabled:bg-[#a78bfa]/50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
