"use client";

import { Shield, Zap, Lock, UserCheck, Star, CheckCircle } from "lucide-react";
import { useGlare } from "@/lib/useGlare";
import { useCountUp } from "@/lib/useCountUp";

const features = [
  {
    icon: Shield,
    title: "Trusted & Reliable",
    description: "Accurate background checks that help build employer trust.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "AI-Powered Speed",
    description: "Quick & digital process that keeps you ahead in the hiring race.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your data is protected with industry-leading security standards.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: UserCheck,
    title: "Stay Job-Ready",
    description: "A verified profile makes you a more confident candidate.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Star,
    title: "Global Standards",
    description: "Screening aligned with global compliance & quality benchmarks.",
    gradient: "from-purple-500 to-fuchsia-500",
  },
];

function AnimatedStat({ end, label, suffix = "" }: { end: number; label: string; suffix?: string }) {
  const { count, ref } = useCountUp(end, 2000);
  return (
    <div ref={ref} className="glass-card card-glare rounded-2xl p-6 text-center">
      <p className="text-3xl lg:text-4xl font-bold gradient-text">
        {count}{suffix}
      </p>
      <p className="text-sm text-gray-400 mt-2">{label}</p>
    </div>
  );
}

const stats = [
  { end: 10, suffix: "M+", label: "Verified Candidates" },
  { end: 1000, suffix: "+", label: "Partner Companies" },
  { end: 24, suffix: "/7", label: "Workflow Access" },
  { end: 24, suffix: "/7", label: "AI Support" },
];

export default function Features() {
  const { onMouseMove } = useGlare<HTMLDivElement>();
  return (
    <section className="py-24 bg-[#0a0a1a] relative">
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-[20%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-[20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 glass rounded-full text-sm font-medium mb-4 text-indigo-400">
            Why Choose Us
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            <span className="text-white">Why Job Seekers Choose </span>
            <span className="gradient-text">HireRight</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            We provide the tools and trust you need to advance your career
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16" onMouseMove={onMouseMove}>
          {stats.map((stat) => (
            <AnimatedStat key={stat.label} end={stat.end} suffix={stat.suffix} label={stat.label} />
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6" onMouseMove={onMouseMove}>
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card card-glare rounded-2xl p-6 group"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 glass-card card-glare rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: "Security Controls" },
              { icon: Lock, label: "Privacy Tools" },
              { icon: CheckCircle, label: "Tenant Isolation" },
              { icon: Star, label: "Service Monitoring" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-3 hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <badge.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-gray-300">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
