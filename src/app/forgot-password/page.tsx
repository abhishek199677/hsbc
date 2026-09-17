"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle, Shield } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      setSent(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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

        <div className="bg-[rgba(24,24,27,0.6)] backdrop-blur-xl border border-[#27272a] rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#fafafa]">Reset Password</h1>
            <p className="text-[#a1a1aa] mt-2">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-[#4ade80]" />
              </div>
              {resetUrl ? (
                <>
                  <p className="text-[#a1a1aa] mb-4">
                    Password reset link generated. Click below to reset your password.
                  </p>
                  <a
                    href={resetUrl}
                    className="inline-block w-full bg-[#a78bfa] text-[#09090b] py-3 rounded-lg font-medium text-center hover:bg-[#8b5cf6] transition-colors mb-3"
                  >
                    Reset Password Now
                  </a>
                </>
              ) : (
                <p className="text-[#a1a1aa] mb-6">
                  If an account exists for <span className="font-medium text-[#fafafa]">{email}</span>,
                  we&apos;ve sent a password reset link to your inbox. It expires in 1 hour.
                </p>
              )}
              <Link
                href="/login"
                className="inline-block w-full bg-[#27272a] text-[#fafafa] py-3 rounded-lg font-medium text-center hover:bg-[#3f3f46] transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 mb-4 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#18181b] border border-[#27272a] text-[#fafafa] text-sm rounded-lg focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa]"
                      placeholder="you@example.com"
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
                      Sending...
                    </span>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-[#a1a1aa]">
                  Remembered your password?{" "}
                  <Link href="/login" className="text-[#f5c542] font-medium hover:text-[#f5c542]/80">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
