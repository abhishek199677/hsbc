"use client";

import { useState } from "react";
import {
  Rocket,
  Building2,
  Users,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Plus,
  X,
  PartyPopper,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
  initialStep?: number;
}

const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Real Estate",
  "Media & Entertainment",
  "Government",
  "Other",
];

const COMPANY_SIZE_OPTIONS = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
];

export default function OnboardingWizard({
  onComplete,
  onSkip,
  initialStep = 1,
}: OnboardingWizardProps) {
  const { organization } = useAuth();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({
    name: organization?.name || "",
    industry: "",
    companySize: "",
  });

  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  const totalSteps = 5;
  const progress = Math.round((currentStep / totalSteps) * 100);

  const saveStep = async (step: number, data?: Record<string, unknown>) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/account/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ step, data }),
      });
    } catch (error) {
      console.error("Failed to save onboarding step:", error);
    }
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      if (!companyInfo.name.trim()) {
        toast.error("Please enter your organization name");
        return;
      }
      if (!companyInfo.industry) {
        toast.error("Please select an industry");
        return;
      }
      await saveStep(2, companyInfo);
    }

    if (currentStep === 3 && teamEmails.length > 0) {
      await saveStep(3, { emails: teamEmails });
    }

    if (currentStep === 4) {
      await saveStep(4);
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await saveStep(5);
      toast.success("Onboarding completed!");
      onComplete();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (teamEmails.includes(email)) {
      toast.error("Email already added");
      return;
    }
    setTeamEmails([...teamEmails, email]);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setTeamEmails(teamEmails.filter((e) => e !== email));
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Rocket className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Let&apos;s set up your account
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Welcome to {organization?.name || "your dashboard"}! We&apos;ll
              help you get everything configured so you can start hiring
              efficiently with AI-powered interviews.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
              <div className="bg-gray-50 rounded-lg p-4">
                <Building2 className="w-6 h-6 text-indigo-600 mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">
                  Company Profile
                </h3>
                <p className="text-xs text-gray-500">
                  Set up your organization details
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <Users className="w-6 h-6 text-indigo-600 mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">
                  Invite Your Team
                </h3>
                <p className="text-xs text-gray-500">
                  Collaborate with colleagues
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <Sparkles className="w-6 h-6 text-indigo-600 mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">
                  First Interview
                </h3>
                <p className="text-xs text-gray-500">
                  Create your first AI interview
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900">
                Company Information
              </h2>
              <p className="text-sm text-gray-600">
                Tell us about your organization
              </p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  value={companyInfo.industry}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, industry: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Select industry</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  value={companyInfo.companySize}
                  onChange={(e) =>
                    setCompanyInfo({
                      ...companyInfo,
                      companySize: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Select company size</option>
                  {COMPANY_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900">
                Invite Your Team
              </h2>
              <p className="text-sm text-gray-600">
                Add team members to collaborate (optional)
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter email address"
                />
                <button
                  onClick={addEmail}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {teamEmails.length > 0 && (
                <div className="space-y-2">
                  {teamEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        onClick={() => removeEmail(email)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 text-center">
                Invitations will be sent when you complete onboarding
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900">
                Create Your First Interview
              </h2>
              <p className="text-sm text-gray-600">
                Set up an AI-powered interview to get started
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 text-center">
                <Sparkles className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Ready to interview?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You can create your first AI interview from the dashboard
                  after completing onboarding. Our AI will handle scheduling,
                  screening, and evaluation.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AI-powered analysis included</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                You can skip this and create interviews later from your
                dashboard.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <PartyPopper className="w-10 h-10 text-green-600" />
              </div>
              <div className="confetti-container">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={
                      {
                        "--confetti-delay": `${Math.random() * 0.5}s`,
                        "--confetti-x": `${Math.random() * 200 - 100}px`,
                        "--confetti-rotation": `${Math.random() * 360}deg`,
                        "--confetti-color": [
                          "#4f46e5",
                          "#7c3aed",
                          "#ec4899",
                          "#f59e0b",
                          "#10b981",
                        ][Math.floor(Math.random() * 5)],
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              You&apos;re all set!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Your account is configured and ready to go. Start exploring your
              dashboard and create your first AI interview to see the magic
              in action.
            </p>
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Go to Dashboard
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress bar */}
          <div className="bg-gray-100 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="px-6 py-8 min-h-[400px] flex items-center justify-center">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div>
              {currentStep > 1 && currentStep < 5 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentStep < 5 && (
                <button
                  onClick={onSkip}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Skip for now
                </button>
              )}
              {currentStep < 5 && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
                >
                  {currentStep === 4 ? (
                    <>
                      <Send className="w-4 h-4" />
                      Complete Setup
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
