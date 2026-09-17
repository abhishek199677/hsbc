"use client";

import { Shield, Zap, Lock, UserCheck, Star, CheckCircle, Sparkles, Globe, BarChart3, Users, Brain, FileCheck, Clock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Screening",
    description: "Advanced machine learning algorithms verify candidate information with 99.7% accuracy, reducing manual review by 85%.",
    color: "var(--primary)",
    metric: "99.7%",
    metricLabel: "Accuracy",
  },
  {
    icon: Zap,
    title: "48-Hour Turnaround",
    description: "Industry-leading verification speed. Complete background checks in 48 hours vs. industry average of 5-7 days.",
    color: "var(--secondary)",
    metric: "48hr",
    metricLabel: "Avg. time",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 Type II certified with end-to-end encryption. Your data never leaves your dedicated tenant.",
    color: "var(--success)",
    metric: "SOC 2",
    metricLabel: "Certified",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Screen candidates across 190+ countries with localized compliance for GDPR, CCPA, and regional regulations.",
    color: "var(--primary)",
    metric: "190+",
    metricLabel: "Countries",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Comprehensive dashboards with actionable insights. Track verification status, bottlenems, and team performance.",
    color: "var(--primary)",
    metric: "360°",
    metricLabel: "Visibility",
  },
  {
    icon: Users,
    title: "Seamless Integration",
    description: "Connect with 50+ ATS and HRIS platforms. Workday, Greenhouse, Lever, and more in minutes.",
    color: "var(--primary)",
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
    <section className="py-28 bg-background relative">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header - More authoritative */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-surface border border-border">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm text-muted-foreground font-medium">Why 1,200+ enterprises choose Techcitta</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            <span className="text-foreground">Built for teams that</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-[#c4b5fd] bg-clip-text text-transparent">hire at scale</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Stop guessing. Start verifying. Our platform combines AI precision with enterprise security to deliver hiring decisions you can trust.
          </p>
        </div>

        {/* Features grid - More sophisticated */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-surface border border-border p-7 rounded-2xl hover:border-primary/20 transition-all duration-500 relative overflow-hidden"
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(90deg, transparent, " + feature.color + ", transparent)" }}
              />

              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: feature.color + "10", border: "1px solid " + feature.color + "20" }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground tracking-tight">{feature.metric}</p>
                  <p className="text-[11px] text-muted-foreground">{feature.metricLabel}</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-[1.7]">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Capabilities bar - Enterprise verification types */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-2">Comprehensive Verification Suite</h3>
            <p className="text-sm text-muted-foreground">All the checks you need, powered by AI</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {capabilities.map((cap) => (
              <div
                key={cap.label}
                className="flex flex-col items-center gap-3 p-4 bg-background border border-border rounded-xl hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <cap.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground text-center font-medium">{cap.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
