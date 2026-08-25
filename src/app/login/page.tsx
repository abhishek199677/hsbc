"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, organization } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
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
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] aura" />
        <div className="absolute bottom-10 right-[5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] aura" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8 group">
          <img
            src={organization?.logoUrl || "/logo.png"}
            alt={organization?.name || "HireRight"}
            className="h-10 w-auto rounded-md transition-all duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Glass card */}
        <div className="glass-card rounded-3xl p-8 border border-white/10">
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

          <div className="relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-gray-300">Welcome back</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Sign In</h1>
              <p className="text-gray-400 mt-2">
                Continue your journey{organization ? ` with ${organization.name}` : ""}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {twoFactorRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Authentication Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-center tracking-[0.5em] text-lg"
                    placeholder="000000"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full glare bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                  Sign Up Free
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            SSL Encrypted
          </span>
          <span className="w-1 h-1 bg-gray-600 rounded-full" />
          <span>SOC 2 Compliant</span>
          <span className="w-1 h-1 bg-gray-600 rounded-full" />
          <span>GDPR Ready</span>
        </div>
      </div>
    </div>
  );
}
