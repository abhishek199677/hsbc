"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Loader } from "lucide-react";

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid invitation link — no token found.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid invitation link.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to accept invitation.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="bg-[#18181b] rounded-xl shadow-lg p-10 text-center max-w-md w-full border border-[#27272a]">
          <div className="w-16 h-16 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#22c55e]" />
          </div>
          <h1 className="text-2xl font-bold text-[#fafafa] mb-2">Welcome to the team!</h1>
          <p className="text-[#a1a1aa] mb-4">
            Your account is ready. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="bg-[#18181b] rounded-xl shadow-lg p-8 max-w-md w-full border border-[#27272a]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#fafafa]">Accept Invitation</h1>
          <p className="text-[#a1a1aa] mt-1">Set your name and password to join the team</p>
        </div>

        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#27272a] rounded-lg px-3 py-2 bg-[#09090b] text-[#fafafa] focus:ring-2 focus:ring-[#a78bfa] focus:border-transparent outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[#27272a] rounded-lg px-3 py-2 bg-[#09090b] text-[#fafafa] focus:ring-2 focus:ring-[#a78bfa] focus:border-transparent outline-none"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-[#27272a] rounded-lg px-3 py-2 bg-[#09090b] text-[#fafafa] focus:ring-2 focus:ring-[#a78bfa] focus:border-transparent outline-none"
              placeholder="Repeat your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#a78bfa] text-white py-2.5 rounded-lg font-medium hover:bg-[#8b5cf6] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Accept & Join"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader className="w-8 h-8 text-[#a78bfa] animate-spin" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
