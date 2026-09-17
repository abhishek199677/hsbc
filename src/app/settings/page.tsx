"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Mail,
  CheckCircle,
  XCircle,
  CreditCard,
  Download,
  Trash2,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_PRICES_USD, formatPrice } from "@/lib/pricing";
import { useCurrency } from "@/lib/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Africa/Nairobi",
  "Africa/Lagos",
];

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    period: "/month",
    features: [
      "100 interviews / month",
      "Full video & analytics",
      "Email + WhatsApp reminders",
      "Priority AI evaluations",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    period: "/month",
    features: [
      "Unlimited interviews",
      "Everything in Pro",
      "Custom branding & roles",
      "Priority support",
    ],
    highlighted: false,
  },
];

interface AccountInfo {
  user: { email: string; name: string | null; emailVerified: boolean };
  organization: { id: string; name: string; plan: string; planStatus: string | null } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [timezoneSaving, setTimezoneSaving] = useState(false);
  const [tzMessage, setTzMessage] = useState("");
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [verificationMsg, setVerificationMsg] = useState("");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;

    (async () => {
      try {
        const [meRes, profileRes] = await Promise.all([
          fetch("/api/account/me"),
          fetch("/api/profile"),
        ]);
        const me = await meRes.json();
        const profile = await profileRes.json();
        if (cancelled) return;
        if (me.success) setInfo(me);
        if (profile.success && profile.profile?.timezone) {
          setTimezone(profile.profile.timezone);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const emailVerified = info?.user?.emailVerified ?? user?.emailVerified ?? false;

  const handleResendVerification = async () => {
    setVerificationBusy(true);
    setVerificationMsg("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user?.email || "" }),
      });
      const data = await response.json();
      setVerificationMsg(data.message || data.error || "Please try again later.");
    } catch {
      setVerificationMsg("Something went wrong. Please try again.");
    } finally {
      setVerificationBusy(false);
    }
  };

  const handleSaveTimezone = async () => {
    if (!token) return;
    setTimezoneSaving(true);
    setTzMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone }),
      });
      const data = await response.json();
      setTzMessage(data.success ? "Timezone saved." : (data.error || "Failed to save timezone."));
    } finally {
      setTimezoneSaving(false);
    }
  };

  const handleCheckout = async (plan: string) => {
    setBillingBusy(true);
    setBillingError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, currency }),
      });
      const data = await response.json();
      if (data.billingDisabled) {
        setBillingError("Billing is not configured on this deployment yet.");
        return;
      }
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout");
      }
      window.location.assign(data.url);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBillingBusy(false);
    }
  };

  const handlePortal = async () => {
    setBillingBusy(true);
    setBillingError("");
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.billingDisabled) {
        setBillingError("Billing is not configured on this deployment yet.");
        return;
      }
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not open billing portal");
      }
      window.location.assign(data.url);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBillingBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/account/export");
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hireright-account-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    if (deleteConfirm.trim() !== "DELETE") {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Deletion failed");
      }
      logout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="animate-spin h-8 w-8 border-4 border-[#a78bfa] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const plan = info?.organization?.plan || "starter";
  const planStatus = info?.organization?.planStatus;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="text-[#a1a1aa] mt-1">Manage verification, billing, and your data.</p>
        </div>

        {/* Email verification */}
        <section className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-[#a78bfa]" />
            <h2 className="text-lg font-semibold text-[#fafafa]">Email Verification</h2>
          </div>
          {emailVerified ? (
            <div className="flex items-center gap-2 text-[#22c55e] bg-[#22c55e]/10 p-4 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{info?.user?.email || user.email} is verified.</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-[#f59e0b] bg-[#f59e0b]/10 p-4 rounded-lg mb-4">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Your email is not verified yet. Verify it to unlock the full experience.
                </span>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={verificationBusy}
                className="bg-[#a78bfa] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 rounded-lg"
              >
                {verificationBusy ? "Sending..." : "Resend Verification Email"}
              </button>
              {verificationMsg && (
                <p className="text-sm text-[#a1a1aa] mt-3">{verificationMsg}</p>
              )}
            </div>
          )}
        </section>

        {/* Billing */}
        <section className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-[#a78bfa]" />
            <h2 className="text-lg font-semibold text-[#fafafa]">Plan & Billing</h2>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-[#a1a1aa]">Current plan:</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#a78bfa] bg-[#a78bfa]/10 px-3 py-1 rounded-lg capitalize">
              {plan}
              {planStatus && planStatus !== "active" && plan !== "starter" && (
                <span className="text-xs text-[#ef4444] lowercase">({planStatus})</span>
              )}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-[#27272a] bg-[#27272a] px-4 py-3 rounded-lg">
            <p className="text-xs text-[#a1a1aa]">
              Prices shown in your currency. Billed by Stripe in the plan&apos;s currency.
            </p>
            <CurrencySelector className="bg-[#18181b] border border-[#27272a] px-2 py-1 rounded-lg" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {PLANS.map((p) => {
              const isCurrent = plan === p.id;
              return (
                <div
                  key={p.id}
                  className={`border p-5 rounded-xl ${p.highlighted ? "border-[#a78bfa] bg-[#a78bfa]/5" : "border-[#27272a] bg-[#27272a]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#fafafa] flex items-center gap-1">
                      {p.name}
                      {p.highlighted && <Sparkles className="w-4 h-4 text-[#a78bfa]" />}
                    </h3>
                    {isCurrent && (
                      <span className="text-xs font-medium text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-lg">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-[#fafafa]">
                      {formatPrice(PLAN_PRICES_USD[p.id].monthly, currency)}
                    </span>
                    <span className="text-sm text-[#a1a1aa]">{p.period}</span>
                  </div>
                  <ul className="space-y-1 mb-4">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm text-[#a1a1aa] flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <button
                      onClick={() => handleCheckout(p.id)}
                      disabled={billingBusy}
                      className="w-full bg-[#a78bfa] text-white py-2.5 text-sm font-medium hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 rounded-lg"
                    >
                      Upgrade to {p.name}
                    </button>
                  )}
                  {isCurrent && plan !== "starter" && (
                    <button
                      onClick={handlePortal}
                      disabled={billingBusy}
                      className="w-full border border-[#27272a] text-[#a1a1aa] py-2.5 text-sm font-medium hover:bg-[#27272a] transition-colors disabled:opacity-50 rounded-lg"
                    >
                      Manage Subscription
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[#a1a1aa]">
            Start free on the Starter plan (3 interviews / month). Upgrade anytime to unlock more interviews,
            video analytics, and longer retention.
          </p>

          {billingError && (
            <div className="mt-4 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm rounded-lg">
              {billingError}
            </div>
          )}
        </section>

        {/* Timezone */}
        <section className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-[#a78bfa]" />
            <h2 className="text-lg font-semibold text-[#fafafa]">Timezone</h2>
          </div>
          <p className="text-sm text-[#a1a1aa] mb-4">
            Your interview schedule and reminders will be shown in this timezone.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-[#27272a] border border-[#27272a] p-2.5 text-sm text-[#fafafa] rounded-lg focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa]"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <button
              onClick={handleSaveTimezone}
              disabled={timezoneSaving}
              className="bg-[#a78bfa] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 rounded-lg"
            >
              {timezoneSaving ? "Saving..." : "Save Timezone"}
            </button>
            {tzMessage && <span className="text-sm text-[#a1a1aa]">{tzMessage}</span>}
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-[#a78bfa]" />
            <h2 className="text-lg font-semibold text-[#fafafa]">Your Data (GDPR)</h2>
          </div>
          <p className="text-sm text-[#a1a1aa] mb-4">
            You can download everything we store about you, or permanently delete your account and all
            associated data (profile, resume, interview recordings, and evaluations).
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 border border-[#27272a] text-[#a1a1aa] px-5 py-2.5 text-sm font-medium hover:bg-[#27272a] transition-colors rounded-lg"
            >
              <Download className="w-4 h-4" />
              Export My Data
            </button>
          </div>
          <div className="bg-[#ef4444]/5 border border-[#ef4444]/30 p-4 rounded-xl">
            <p className="text-sm font-medium text-[#ef4444] mb-2 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </p>
            <p className="text-xs text-[#ef4444]/80 mb-3">
              This permanently deletes your account and all associated data. This cannot be undone.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder='Type DELETE to confirm'
                className="bg-[#27272a] border border-[#27272a] p-2.5 text-sm text-[#fafafa] rounded-lg focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
              />
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-[#ef4444] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#dc2626] transition-colors disabled:opacity-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
            {deleteError && <p className="text-sm text-[#ef4444] mt-3">{deleteError}</p>}
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link href="/profile" className="text-[#f5c542] font-medium hover:text-[#f5c542]/80 inline-flex items-center gap-1">
            Back to profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
