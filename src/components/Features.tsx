"use client";

import { Shield, Zap, Lock, UserCheck, Star, CheckCircle, Sparkles, Globe, BarChart3, Users, Brain, FileCheck, Clock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Screening",
    description: "Advanced machine learning algorithms verify candidate information with 99.7% accuracy, reducing manual review by 85%.",
    color: "#a78bfa",
    metric: "99.7%",
    metricLabel: "Accuracy",
  },
  {
    icon: Zap,
    title: "48-Hour Turnaround",
    description: "Industry-leading verification speed. Complete background checks in 48 hours vs. industry average of 5-7 days.",
    color: "#f5c542",
    metric: "48hr",
    metricLabel: "Avg. time",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 Type II certified with end-to-end encryption. Your data never leaves your dedicated tenant.",
    color: "#22c55e",
    metric: "SOC 2",
    metricLabel: "Certified",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Screen candidates across 190+ countries with localized compliance for GDPR, CCPA, and regional regulations.",
    color: "#60a5fa",
    metric: "190+",
    metricLabel: "Countries",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Comprehensive dashboards with actionable insights. Track verification status, bottlenems, and team performance.",
    color: "#f472b6",
    metric: "360°",
    metricLabel: "Visibility",
  },
  {
    icon: Users,
    title: "Seamless Integration",
    description: "Connect with 50+ ATS and HRIS platforms. Workday, Greenhouse, Lever, and more in minutes.",
    color: "#a78bfa",
    metric: "50+",
    metricLabel: "Integrations",
  },
];

const capabilities = [
  { icon: FileCheck, label: "Employment Verification" },
  { icon: Shield, label: "Criminal Background" },
  { icon: Globe, label: "Education Verification" },
  { icon: Lock, label: "Reference Checks" },
  { icon: CheckCircle, label: "Credit History" },
  { icon: Clock, label: "Drug Screening" },
];

export default function Features() {
  return (
    <section className="py-28 bg-[#06060a] relative">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header - More authoritative */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-[#13131a] border border-[#1e1e28]">
            <Sparkles className="w-4 h-4 text-[#f5c542]" />
            <span className="text-sm text-[#8b8ba0] font-medium">Why 1,200+ enterprises choose Techcitta</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            <span className="text-[#f8f8fc]">Built for teams that</span>
            <br />
            <span className="bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] bg-clip-text text-transparent">hire at scale</span>
          </h2>
          <p className="text-[#8b8ba0] text-lg leading-relaxed">
            Stop guessing. Start verifying. Our platform combines AI precision with enterprise security to deliver hiring decisions you can trust.
          </p>
        </div>

        {/* Features grid - More sophisticated */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-[#13131a] border border-[#1e1e28] p-7 rounded-2xl hover:border-[#a78bfa]/20 transition-all duration-500 relative overflow-hidden"
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)` }}
              />

              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}10`, border: `1px solid ${feature.color}20` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#f8f8fc] tracking-tight">{feature.metric}</p>
                  <p className="text-[11px] text-[#8b8ba0]">{feature.metricLabel}</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-[#f8f8fc] mb-3">{feature.title}</h3>
              <p className="text-sm text-[#8b8ba0] leading-[1.7]">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Capabilities bar - Enterprise verification types */}
        <div className="bg-[#13131a] border border-[#1e1e28] rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-[#f8f8fc] mb-2">Comprehensive Verification Suite</h3>
            <p className="text-sm text-[#8b8ba0]">All the checks you need, powered by AI</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {capabilities.map((cap) => (
              <div
                key={cap.label}
                className="flex flex-col items-center gap-3 p-4 bg-[#0f0f16] border border-[#1e1e28] rounded-xl hover:border-[#a78bfa]/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-[#a78bfa]/10 rounded-lg flex items-center justify-center group-hover:bg-[#a78bfa]/15 transition-colors">
                  <cap.icon className="w-5 h-5 text-[#a78bfa]" />
                </div>
                <span className="text-xs text-[#8b8ba0] text-center font-medium">{cap.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
