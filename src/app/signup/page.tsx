"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, Briefcase, Building2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { organization } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("jobseeker");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, orgName, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
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
        <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] aura" />
        <div className="absolute bottom-10 left-[5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] aura" />
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
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none" />

          <div className="relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Get started free</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Create Account</h1>
              <p className="text-gray-400 mt-2">
                Start your journey to the right opportunity
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company / Organization <span className="text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    name="organization"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("jobseeker")}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${
                      role === "jobseeker"
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <Briefcase className="w-6 h-6" />
                    <span className="font-medium text-sm">Job Seeker</span>
                    <span className="text-xs opacity-60">Looking for opportunities</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("employer")}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${
                      role === "employer"
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                    <span className="font-medium text-sm">Employer</span>
                    <span className="text-xs opacity-60">Hiring talent</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="Min 8 chars"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder="Re-enter"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>

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
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                  Sign In
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
