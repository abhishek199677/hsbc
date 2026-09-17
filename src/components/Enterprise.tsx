"use client";

import { Shield, Lock, CheckCircle, Building2, ArrowRight, ChevronRight, Zap, Globe, Server, Eye } from "lucide-react";

const securityBadges = [
  { icon: Shield, label: "SOC 2 Type II", description: "Certified" },
  { icon: Lock, label: "GDPR", description: "Compliant" },
  { icon: CheckCircle, label: "ISO 27001", description: "Certified" },
  { icon: Eye, label: "CCPA", description: "Compliant" },
];

const integrations = [
  { name: "Workday", color: "#005CB9" },
  { name: "SAP", color: "#0070F2" },
  { name: "Oracle", color: "#C74634" },
  { name: "Greenhouse", color: "#24A800" },
  { name: "Lever", color: "#6B4FBB" },
  { name: "BambooHR", color: "#7EC699" },
  { name: "ADP", color: "#D0271D" },
  { name: "Workable", color: "#2B6FED" },
];

const roiMetrics = [
  {
    metric: "85%",
    label: "Reduction in manual screening time",
    description: "Automate repetitive verification tasks",
    color: "#a78bfa",
  },
  {
    metric: "3x",
    label: "Faster time-to-hire",
    description: "48hr vs. industry average 5-7 days",
    color: "#22c55e",
  },
  {
    metric: "60%",
    label: "Cost reduction per hire",
    description: "Lower operational overhead",
    color: "#f5c542",
  },
  {
    metric: "99.7%",
    label: "Verification accuracy",
    description: "AI-powered with human oversight",
    color: "#60a5fa",
  },
];

const enterpriseFeatures = [
  "Dedicated account manager",
  "Custom API integrations",
  "SLA guarantees (99.9% uptime)",
  "On-premise deployment option",
  "White-label solutions",
  "Priority 24/7 support",
];

export default function Enterprise() {
  return (
    <section className="py-28 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-surface border border-border">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Enterprise-Grade Platform</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            <span className="text-foreground">Trusted by industry leaders</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">for critical hiring decisions</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Built for organizations that need enterprise-grade security, compliance, and reliability at scale.
          </p>
        </div>

        {/* ROI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {roiMetrics.map((item) => (
            <div
              key={item.label}
              className="bg-surface border border-border rounded-2xl p-6 relative group hover:border-primary/20 transition-all duration-500"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }}
              />
              <p className="text-4xl font-bold tracking-tight mb-2" style={{ color: item.color }}>
                {item.metric}
              </p>
              <p className="text-sm font-medium text-foreground mb-1">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Two-column layout: Security + Integrations */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {/* Security & Compliance */}
          <div className="bg-surface border border-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center border border-success/20">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Security & Compliance</h3>
                <p className="text-xs text-muted-foreground">Enterprise-grade protection</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {securityBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-3 p-4 bg-background border border-border rounded-xl"
                >
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <badge.icon className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{badge.label}</p>
                    <p className="text-[11px] text-muted-foreground">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {enterpriseFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-surface border border-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Seamless Integrations</h3>
                <p className="text-xs text-muted-foreground">Connect your existing tools</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center gap-3 p-4 bg-background border border-border rounded-xl hover:border-primary/20 transition-colors duration-300 group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: integration.color }}
                  >
                    {integration.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{integration.name}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-sm font-medium text-foreground">50+ Integrations</p>
                  <p className="text-[11px] text-muted-foreground">ATS, HRIS, and more</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="bg-gradient-to-br from-surface to-background border border-border rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="relative">
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Ready to transform your hiring process?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join 1,200+ enterprises that trust Techcitta for their most critical hiring decisions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/enterprise"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-background px-8 py-4 rounded-lg font-semibold text-sm hover:shadow-[0_0_32px_rgba(167,139,250,0.3)] transition-all duration-300"
              >
                Talk to Sales
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/signup"
                className="inline-flex items-center gap-2 bg-transparent border border-border text-foreground px-8 py-4 rounded-lg font-medium text-sm hover:bg-surface hover:border-primary/30 transition-all duration-300"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
