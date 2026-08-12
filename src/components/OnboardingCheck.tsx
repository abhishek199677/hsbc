"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingWizard from "./OnboardingWizard";

interface OnboardingStatus {
  completed: boolean;
  step: number;
}

export default function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;

    let cancelled = false;

    async function checkOnboarding() {
      try {
        const res = await fetch("/api/account/onboarding", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          setOnboarding(data.onboarding);
        }
      } catch (error) {
        console.error("Failed to check onboarding:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkOnboarding();
    return () => { cancelled = true; };
  }, [user, token]);

  if (!user || !token) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (onboarding && !onboarding.completed) {
    return (
      <OnboardingWizard
        onComplete={handleComplete}
        onSkip={handleSkip}
        initialStep={onboarding.step > 0 ? onboarding.step : 1}
      />
    );
  }

  return <>{children}</>;
}
