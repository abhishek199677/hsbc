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
          fetch("/api/account/me", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } }),
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
          Authorization: `Bearer ${token || ""}`,
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
          Authorization: `Bearer ${token}`,
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
          Authorization: `Bearer ${token || ""}`,
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
        headers: { Authorization: `Bearer ${token || ""}` },
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
      const response = await fetch("/api/account/export", {
        headers: { Authorization: `Bearer ${token || ""}` },
      });
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
          Authorization: `Bearer ${token || ""}`,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const plan = info?.organization?.plan || "starter";
  const planStatus = info?.organization?.planStatus;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-1">Manage verification, billing, and your data.</p>
        </div>

        {/* Email verification */}
        <section className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Email Verification</h2>
          </div>
          {emailVerified ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-4">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{info?.user?.email || user.email} is verified.</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl p-4 mb-4">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Your email is not verified yet. Verify it to unlock the full experience.
                </span>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={verificationBusy}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {verificationBusy ? "Sending..." : "Resend Verification Email"}
              </button>
              {verificationMsg && (
                <p className="text-sm text-gray-600 mt-3">{verificationMsg}</p>
              )}
            </div>
          )}
        </section>

        {/* Billing */}
        <section className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Plan & Billing</h2>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Current plan:</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-full px-3 py-1 capitalize">
              {plan}
              {planStatus && planStatus !== "active" && plan !== "starter" && (
                <span className="text-xs text-red-500 lowercase">({planStatus})</span>
              )}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              Prices shown in your currency. Billed by Stripe in the plan&apos;s currency.
            </p>
            <CurrencySelector className="bg-white rounded-lg border border-gray-200 px-2 py-1" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {PLANS.map((p) => {
              const isCurrent = plan === p.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-5 ${p.highlighted ? "border-indigo-300 bg-indigo-50/50" : "border-gray-200"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                      {p.name}
                      {p.highlighted && <Sparkles className="w-4 h-4 text-indigo-500" />}
                    </h3>
                    {isCurrent && (
                      <span className="text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(PLAN_PRICES_USD[p.id].monthly, currency)}
                    </span>
                    <span className="text-sm text-gray-500">{p.period}</span>
                  </div>
                  <ul className="space-y-1 mb-4">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm text-gray-600 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <button
                      onClick={() => handleCheckout(p.id)}
                      disabled={billingBusy}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Upgrade to {p.name}
                    </button>
                  )}
                  {isCurrent && plan !== "starter" && (
                    <button
                      onClick={handlePortal}
                      disabled={billingBusy}
                      className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Manage Subscription
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-500">
            Start free on the Starter plan (3 interviews / month). Upgrade anytime to unlock more interviews,
            video analytics, and longer retention.
          </p>

          {billingError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {billingError}
            </div>
          )}
        </section>

        {/* Timezone */}
        <section className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Timezone</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Your interview schedule and reminders will be shown in this timezone.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <button
              onClick={handleSaveTimezone}
              disabled={timezoneSaving}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {timezoneSaving ? "Saving..." : "Save Timezone"}
            </button>
            {tzMessage && <span className="text-sm text-gray-600">{tzMessage}</span>}
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-white rounded-2xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Your Data (GDPR)</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            You can download everything we store about you, or permanently delete your account and all
            associated data (profile, resume, interview recordings, and evaluations).
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export My Data
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </p>
            <p className="text-xs text-red-600 mb-3">
              This permanently deletes your account and all associated data. This cannot be undone.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder='Type DELETE to confirm'
                className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
            {deleteError && <p className="text-sm text-red-700 mt-3">{deleteError}</p>}
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link href="/profile" className="text-indigo-600 font-medium hover:text-indigo-700 inline-flex items-center gap-1">
            Back to profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
