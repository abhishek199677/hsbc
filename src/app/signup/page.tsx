"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, Briefcase, Building2, Shield } from "lucide-react";
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

    if (password.length < 12) {
      setError("Password must be at least 12 characters");
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
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.05)_0%,transparent_50%)]" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center mb-8 group">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#f5c542]" />
            <span className="text-2xl font-bold text-[#fafafa]">
              {organization?.name || "Techcitta"}
            </span>
          </div>
        </Link>

        <div className="bg-[rgba(24,24,27,0.6)] backdrop-blur-xl border border-[#27272a] rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#fafafa]">Create Account</h1>
            <p className="text-[#a1a1aa] mt-2">Join us today</p>
          </div>

          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444] text-[#ef4444] px-4 py-3 mb-6 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#18181b] border border-[#27272a] text-[#fafafa] placeholder-[#a1a1aa] focus:ring-1 focus:ring-[#a78bfa] focus:border-[#a78bfa] rounded-lg transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#18181b] border border-[#27272a] text-[#fafafa] placeholder-[#a1a1aa] focus:ring-1 focus:ring-[#a78bfa] focus:border-[#a78bfa] rounded-lg transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Company / Organization <span className="text-[#a1a1aa]/50">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                <input
                  type="text"
                  name="organization"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#18181b] border border-[#27272a] text-[#fafafa] placeholder-[#a1a1aa] focus:ring-1 focus:ring-[#a78bfa] focus:border-[#a78bfa] rounded-lg transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-3">
                User Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("jobseeker")}
                  className={`p-4 flex flex-col items-center gap-2 transition-all border rounded-lg ${
                    role === "jobseeker"
                      ? "border-[#a78bfa] bg-[#a78bfa]/10 text-[#a78bfa]"
                      : "border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#a1a1aa] hover:bg-[#27272a]"
                  }`}
                >
                  <Briefcase className="w-6 h-6" />
                  <span className="font-medium text-sm">Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("employer")}
                  className={`p-4 flex flex-col items-center gap-2 transition-all border rounded-lg ${
                    role === "employer"
                      ? "border-[#f5c542] bg-[#f5c542]/10 text-[#f5c542]"
                      : "border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#a1a1aa] hover:bg-[#27272a]"
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                  <span className="font-medium text-sm">Employer</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#18181b] border border-[#27272a] text-[#fafafa] placeholder-[#a1a1aa] focus:ring-1 focus:ring-[#a78bfa] focus:border-[#a78bfa] rounded-lg transition-all"
                    placeholder="••••••••"
                    required
                    minLength={12}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#18181b] border border-[#27272a] text-[#fafafa] placeholder-[#a1a1aa] focus:ring-1 focus:ring-[#a78bfa] focus:border-[#a78bfa] rounded-lg transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            >
              {showPassword ? "Hide credentials" : "Show credentials"}
            </button>

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
            <p className="text-sm text-[#a1a1aa]">
              Existing user?{" "}
              <Link href="/login" className="text-[#f5c542] font-semibold hover:text-[#f5c542]/80 transition-colors">
                Sign In
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
