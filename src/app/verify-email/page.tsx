"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { user, token: authToken } = useAuth();
  const token = searchParams.get("token");
  const pendingEmail = searchParams.get("email");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  );
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const verifyAttempted = useRef(false);

  useEffect(() => {
    if (!token || status !== "verifying" || verifyAttempted.current) return;
    verifyAttempted.current = true;
    (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been verified. You can now sign in.");
        } else {
          setStatus("error");
          if (data.error === "invalid-token") {
            setMessage("This verification link has already been used or is invalid. Please request a new one.");
          } else if (data.error === "expired-token") {
            setMessage("This verification link has expired. Please request a new one.");
          } else {
            setMessage(data.error || "Verification failed. Please try again.");
          }
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    })();
  }, [token, status]);

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken || ""}`,
        },
        body: JSON.stringify({ email: user?.email || pendingEmail || "" }),
      });
      const data = await response.json();
      setMessage(data.message || (data.error || "Please try again later."));
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-4 flex justify-center">
            {status === "success" ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : status === "error" ? (
              <XCircle className="w-16 h-16 text-red-500" />
            ) : (
              <Mail className="w-16 h-16 text-indigo-500" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === "success"
              ? "Email Verified!"
              : status === "error"
              ? "Verification Failed"
              : "Check Your Inbox"}
          </h1>

          <p className="text-gray-500 mb-6">
            {status === "verifying"
              ? "Verifying your email..."
              : status === "success"
              ? message
              : status === "error" && token
              ? message
              : "We sent a verification link to your email. Click it to verify your account. If you didn't receive it, you can resend below."}
          </p>

          {status !== "success" && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>
          )}

          <div className="mt-6">
            {status === "success" ? (
              <Link href="/login" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center">
                Go to Sign In
              </Link>
            ) : (
              <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
                Go to Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
