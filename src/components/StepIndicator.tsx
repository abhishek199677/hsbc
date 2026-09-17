"use client";

import { Check } from "lucide-react";

interface Step {
  number: number;
  label: string;
  sublabel: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-8 px-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 flex items-center justify-center text-xs font-bold rounded-lg transition-colors ${
                step.number < currentStep
                  ? "bg-[#a78bfa] text-white"
                  : step.number === currentStep
                  ? "bg-[#a78bfa] text-white"
                  : "bg-[#27272a] text-[#a1a1aa]"
              }`}
            >
              {step.number < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <div className="text-center mt-2">
              <p className={`text-xs font-medium ${step.number === currentStep ? "text-[#a78bfa]" : "text-[#a1a1aa]"}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-[#a1a1aa] hidden sm:block">{step.sublabel}</p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-2 ${
                step.number < currentStep ? "bg-[#a78bfa]" : "bg-[#27272a]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
