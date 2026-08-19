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
    gradient: "from-rose-500 to-pink-500",
  },
  {
    number: 2,
    icon: FileCheck,
    title: "AI-Powered Screening",
    description: "Our advanced AI verifies your information quickly & accurately.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    number: 3,
    icon: CheckCircle,
    title: "Get Matched",
    description: "Receive personalized job matches based on your skills and preferences.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    number: 4,
    icon: Briefcase,
    title: "Land Your Dream Job",
    description: "Move forward with confidence. More trust. More opportunities.",
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function HowItWorks() {
  const { onMouseMove } = useGlare<HTMLDivElement>();
  return (
    <section className="py-24 bg-[#0a0a1a] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 glass rounded-full text-sm font-medium mb-4 text-indigo-400">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            <span className="text-white">How </span>
            <span className="gradient-text">HireRight</span>
            <span className="text-white"> Works</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Get verified and matched with the right opportunities in just 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative" onMouseMove={onMouseMove}>
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-rose-500/50 via-indigo-500/50 via-green-500/50 to-amber-500/50 rounded-full" />

          {steps.map((step) => (
            <div key={step.number} className="text-center relative group">
              <div className={`w-32 h-32 bg-gradient-to-br ${step.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-14 h-14 text-white" />
              </div>
              <div className="text-sm font-bold gradient-text mb-2">Step {step.number}</div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 max-w-[200px] mx-auto leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link
            href="/signup"
            className="glare inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
          >
            Start Your Journey
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
