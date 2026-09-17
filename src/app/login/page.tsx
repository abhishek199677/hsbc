"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, organization } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, twoFactorToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.twoFactorRequired) setTwoFactorRequired(true);
        if (data.twoFactorSetupRequired) setTwoFactorSetupRequired(true);
        throw new Error(data.error || "Login failed");
      }

      login(data.token, data.user, data.organization);

      if (data.user.role === "employer" || data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/profile");
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
            <span className="text-2xl font-bold text-[#fafafa]">
              {organization?.name || "Techcitta"}
            </span>
          </div>
        </Link>

        <div className="bg-[rgba(24,24,27,0.6)] backdrop-blur-xl border border-[#27272a] rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#fafafa]">Sign In</h1>
            <p className="text-[#a1a1aa] mt-2">
              {organization ? organization.name : "Welcome back"}
            </p>
          </div>

          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444] text-[#ef4444] px-4 py-3 mb-6 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#18181b] border border-[#27272a] text-[#fafafa] placeholder-[#a1a1aa] focus:ring-1 focus:ring-[#a78bfa] focus:border-[#a78bfa] rounded-lg transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {twoFactorRequired && (
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Authentication Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-3.5 bg-[#18181b] border border-[#27272a] text-[#fafafa] placeholder-[#a1a1aa] focus:ring-1 focus:ring-[#a78bfa] focus:border-[#a78bfa] rounded-lg transition-all text-center tracking-[0.5em] text-lg"
                  placeholder="000000"
                  required
                />
              </div>
            )}

            {twoFactorSetupRequired && (
              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-4 py-3 text-sm rounded-lg">
                <p className="font-medium mb-1">2FA Setup Required</p>
                <p className="text-[#a1a1aa]">
                  Two-factor authentication is required for admin accounts.{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/settings")}
                    className="underline hover:text-[#f5c542]"
                  >
                    Set up 2FA now
                  </button>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-[#18181b] border border-[#27272a] text-[#fafafa] placeholder-[#a1a1aa] focus:ring-1 focus:ring-[#a78bfa] focus:border-[#a78bfa] rounded-lg transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-[#a78bfa] hover:text-[#8b5cf6] transition-colors">
                Recover password
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#a78bfa] text-[#09090b] py-3.5 rounded-lg font-semibold hover:bg-[#8b5cf6] transition-all shadow-lg shadow-[#a78bfa]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[#a1a1aa]">
              New user?{" "}
              <Link href="/signup" className="text-[#a78bfa] font-semibold hover:text-[#8b5cf6] transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#a1a1aa]">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Encrypted
          </span>
          <span className="text-[#27272a]">|</span>
          <span>SOC 2</span>
          <span className="text-[#27272a]">|</span>
          <span>GDPR</span>
        </div>
      </div>
    </div>
  );
}
