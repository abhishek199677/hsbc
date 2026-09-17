"use client";

import Link from "next/link";
import { User, FileCheck, CheckCircle, Briefcase, ArrowRight } from "lucide-react";
import { useGlare } from "@/lib/useGlare";

const steps = [
  {
    number: 1,
    icon: User,
    title: "Create Your Profile",
    description: "Sign up in minutes and share your professional details securely.",
  },
  {
    number: 2,
    icon: FileCheck,
    title: "AI-Powered Screening",
    description: "Our advanced AI verifies your information quickly & accurately.",
  },
  {
    number: 3,
    icon: CheckCircle,
    title: "Get Matched",
    description: "Receive personalized job matches based on your skills and preferences.",
  },
  {
    number: 4,
    icon: Briefcase,
    title: "Land Your Dream Job",
    description: "Move forward with confidence. More trust. More opportunities.",
  },
];

export default function HowItWorks() {
  const { onMouseMove } = useGlare<HTMLDivElement>();
  return (
    <section className="py-24 bg-[#09090b] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#a78bfa]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-sm font-medium mb-4 text-[#a78bfa]">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            <span className="text-[#fafafa]">How </span>
            <span className="text-[#a78bfa]">HireRight</span>
            <span className="text-[#fafafa]"> Works</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto text-lg">
            Get verified and matched with the right opportunities in just 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative" onMouseMove={onMouseMove}>
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-[#a78bfa]/50 via-[#f5c542]/50 to-[#a78bfa]/50 rounded-full" />

          {steps.map((step) => (
            <div key={step.number} className="text-center relative group">
              <div className="w-32 h-32 bg-[#18181b] border border-[#27272a] rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-xl group-hover:scale-110 group-hover:border-[#a78bfa] transition-all duration-300">
                <step.icon className="w-14 h-14 text-[#a78bfa]" />
              </div>
              <div className="text-sm font-bold text-[#a78bfa] mb-2">Step {step.number}</div>
              <h3 className="text-lg font-bold text-[#fafafa] mb-2">{step.title}</h3>
              <p className="text-sm text-[#a1a1aa] max-w-[200px] mx-auto leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#a78bfa] text-[#09090b] px-8 py-4 rounded-lg font-semibold hover:bg-[#8b5cf6] transition-all duration-200 shadow-sm hover:shadow-lg"
          >
            Start Your Journey
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
