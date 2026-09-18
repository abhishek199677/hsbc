"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle, XCircle, RefreshCw, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { user, token: authToken } = useAuth();
  const token = searchParams.get("token");
  const pendingEmail = searchParams.get("email");
  const initialVerifyUrl = searchParams.get("verifyUrl") || "";
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  );
  const [message, setMessage] = useState("");
  const [verifyUrl, setVerifyUrl] = useState(initialVerifyUrl);
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
      if (data.verifyUrl) {
        setVerifyUrl(data.verifyUrl);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setResending(false);
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

        <div className="bg-[rgba(24,24,27,0.6)] backdrop-blur-xl border border-[#27272a] rounded-xl p-8 text-center">
          <div className="mb-4 flex justify-center">
            {status === "success" ? (
              <CheckCircle className="w-16 h-16 text-[#4ade80]" />
            ) : status === "error" ? (
              <XCircle className="w-16 h-16 text-[#ef4444]" />
            ) : (
              <Mail className="w-16 h-16 text-[#a78bfa]" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#fafafa] mb-2">
            {status === "success"
              ? "Email Verified!"
              : status === "error"
              ? "Verification Failed"
              : "Check Your Inbox"}
          </h1>

          <p className="text-[#a1a1aa] mb-6">
            {status === "verifying"
              ? "Verifying your email..."
              : status === "success"
              ? message
              : status === "error" && token
              ? message
              : "We sent a verification link to your email. Click it to verify your account. If you didn't receive it, you can resend below."}
          </p>

          {status !== "success" && (
            <>
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full bg-[#a78bfa] text-[#09090b] py-3 rounded-lg font-medium hover:bg-[#8b5cf6] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Sending..." : "Resend Verification Email"}
              </button>

              {verifyUrl && (
                <div className="mt-4 p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <p className="text-[#a1a1aa] text-xs mb-2">Direct verification link (email not configured):</p>
                  <a
                    href={verifyUrl}
                    className="text-[#a78bfa] text-sm break-all hover:underline"
                  >
                    {verifyUrl}
                  </a>
                </div>
              )}
            </>
          )}

          <div className="mt-6">
            {status === "success" ? (
              <Link href="/login" className="w-full bg-[#a78bfa] text-[#09090b] py-3 rounded-lg font-medium hover:bg-[#8b5cf6] transition-colors flex items-center justify-center">
                Go to Sign In
              </Link>
            ) : (
              <Link href="/login" className="text-[#f5c542] font-medium hover:text-[#f5c542]/80">
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
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <div className="animate-spin h-8 w-8 border-4 border-[#a78bfa] border-t-transparent rounded-full" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
