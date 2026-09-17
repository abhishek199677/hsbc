"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Zap, Clock, Users } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "For small teams getting started",
    price: "Free",
    period: "forever",
    features: [
      "Up to 50 verifications/month",
      "Basic AI screening",
      "Email support",
      "Standard integrations",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For growing teams",
    price: "$499",
    period: "/month",
    features: [
      "Up to 500 verifications/month",
      "Advanced AI + human review",
      "Priority support",
      "Custom integrations",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    period: "pricing",
    features: [
      "Unlimited verifications",
      "Dedicated account manager",
      "Custom API integrations",
      "SLA guarantees",
      "On-premise option",
      "White-label available",
    ],
    cta: "Talk to Sales",
    highlighted: false,
  },
];

export default function CTA() {
  return (
    <section className="py-28 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/[0.02] rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            <span className="text-foreground">Simple, transparent</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">pricing for every team</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-surface border rounded-2xl p-8 transition-all duration-500 ${
                plan.highlighted
                  ? 'border-primary/30 shadow-[0_0_40px_rgba(167,139,250,0.08)]'
                  : 'border-border hover:border-primary/20'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-primary to-[#8b5cf6] text-primary-foreground text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period !== "forever" && plan.period !== "pricing" && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Enterprise" ? "/enterprise" : "/signup"}
                className={`block text-center py-3.5 px-6 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-primary to-[#8b5cf6] text-primary-foreground hover:shadow-[0_0_32px_rgba(167,139,250,0.3)]'
                    : 'bg-surface border border-border text-foreground hover:border-primary/30 hover:bg-surface-hover'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-success" />
            <span className="text-sm">SOC 2 Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-sm">99.9% Uptime SLA</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm">48hr Turnaround</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-info" />
            <span className="text-sm">24/7 Enterprise Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
