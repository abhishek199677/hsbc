"use client";

import { CheckCircle, Headphones } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  currentStep?: number;
  progress: number;
}

export default function Sidebar({ currentStep: _currentStep, progress }: SidebarProps) {
  const { organization } = useAuth();
  const brandName = organization?.name || "HireRight";
  const features = [
    "AI-powered matching with the right roles",
    "Interview with confidence",
    "Trusted by top companies globally",
    "100% secure & privacy-first",
    "Helping talent grow, one connection at a time",
  ];

  return (
    <aside className="w-full lg:w-80 bg-[#09090b] text-white p-8 flex flex-col border-r border-[#27272a]">
      <div className="mb-8">
        <img
          src={organization?.logoUrl || "/hireright-logo.svg"}
          alt={brandName}
          className="h-12 w-auto"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold leading-tight">
          Your Journey to the{" "}
          <span className="text-[#a78bfa]">Right</span>{" "}
          Opportunity Starts Here.
        </h2>
        <p className="text-sm text-[#a1a1aa] mt-3 leading-relaxed">
          We&apos;re here to understand you better, so we can connect you with opportunities that truly fit your potential.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="bg-[#18181b] p-4 mb-8 border border-[#27272a] rounded-xl">
        <p className="text-xs text-[#a1a1aa] mb-3">Your Progress</p>
        <div className="relative w-24 h-24 mx-auto">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#27272a" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#a78bfa"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${progress * 2.51} 251`}
              className="progress-ring-circle"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-[#a78bfa]">{progress}%</span>
          </div>
        </div>
        <p className="text-sm text-[#a1a1aa] text-center mt-3">
          Great! Just a few more steps.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-xs text-[#a1a1aa] mb-4">Why {brandName}?</h3>
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#f5c542] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-[#a1a1aa]">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
          <Headphones className="w-4 h-4" />
          <div>
            <p className="font-medium text-white text-xs">Need help?</p>
            <p>care@hireright.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
