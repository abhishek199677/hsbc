"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, XCircle, Shield } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Password reset failed");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-[rgba(24,24,27,0.6)] backdrop-blur-xl border border-[#27272a] rounded-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-[#4ade80]" />
        </div>
        <h1 className="text-2xl font-bold text-[#fafafa] mb-2">Password Reset!</h1>
        <p className="text-[#a1a1aa] mb-6">Your password has been updated. You can now sign in with your new password.</p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-[#a78bfa] text-[#09090b] py-3 rounded-lg font-medium hover:bg-[#8b5cf6] transition-colors"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(24,24,27,0.6)] backdrop-blur-xl border border-[#27272a] rounded-xl p-8">
      <div className="text-center mb-8">
        {token ? (
          <>
            <h1 className="text-2xl font-bold text-[#fafafa]">Set a New Password</h1>
            <p className="text-[#a1a1aa] mt-2">Choose a strong password for your account.</p>
          </>
        ) : (
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-[#ef4444]" />
          </div>
        )}
      </div>

      {!token && (
        <p className="text-[#a1a1aa] text-center mb-6">
          {error}
        </p>
      )}

      {token && (
        <>
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 mb-4 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#18181b] border border-[#27272a] text-[#fafafa] text-sm rounded-lg focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa]"
                  placeholder="At least 12 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#18181b] border border-[#27272a] text-[#fafafa] text-sm rounded-lg focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa]"
                  placeholder="Re-enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#a78bfa] text-[#09090b] py-3 rounded-lg font-medium hover:bg-[#8b5cf6] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting...
                </span>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}

      <div className="mt-6 text-center">
        <Link href="/login" className="text-[#f5c542] font-medium hover:text-[#f5c542]/80">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.05)_0%,transparent_50%)]" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center mb-8 group">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#a78bfa]" />
            <span className="text-2xl font-bold text-[#fafafa]">Techcitta</span>
          </div>
        </Link>

        <Suspense
          fallback={
            <div className="bg-[rgba(24,24,27,0.6)] backdrop-blur-xl border border-[#27272a] rounded-xl p-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#a78bfa] border-t-transparent rounded-full" />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
