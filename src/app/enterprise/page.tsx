"use client";

import Link from "next/link";
import { Building2, CheckCircle, ArrowRight, Users, Zap, Lock, BarChart3, Headphones } from "lucide-react";
import { VERIFICATION_PRICES_USD, formatPrice } from "@/lib/pricing";
import { useCurrency } from "@/lib/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

const features = [
  {
    icon: Building2,
    title: "Enterprise Integration",
    description: "Seamless integration with your existing HRIS, ATS, and ERP systems via our robust API.",
  },
  {
    icon: Users,
    title: "Bulk Verification",
    description: "Process thousands of candidates simultaneously with automated workflows.",
  },
  {
    icon: Zap,
    title: "Real-Time Results",
    description: "Get instant verification results with our AI-powered background check engine.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "SOC 2 Type II certified with end-to-end encryption and audit trails.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Comprehensive analytics and reporting for data-driven hiring decisions.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "24/7 priority support with a dedicated account manager for your organization.",
  },
];

const plans = [
  {
    name: "Startup",
    usd: VERIFICATION_PRICES_USD.startup.monthly,
    period: "/month",
    features: ["Up to 100 verifications", "Basic analytics", "Email support", "API access"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Business",
    usd: VERIFICATION_PRICES_USD.business.monthly,
    period: "/month",
    features: ["Up to 1,000 verifications", "Advanced analytics", "Priority support", "Custom integrations", "Dedicated account manager"],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    usd: null,
    custom: true,
    period: "",
    features: ["Unlimited verifications", "Enterprise analytics", "24/7 support", "Custom workflows", "SLA guarantee", "On-premise option"],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function EnterprisePage() {
  const { currency } = useCurrency();
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Hero */}
      <section className="bg-[#18181b] py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#a78bfa]/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#f5c542]/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#a78bfa]/10 border border-[#a78bfa]/30 px-4 py-2 mb-6 rounded-lg">
              <Building2 className="w-4 h-4 text-[#a78bfa]" />
              <span className="text-sm text-[#fafafa]">Enterprise-Grade Solutions</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#fafafa] mb-6">
              Enterprise <span className="text-[#a78bfa]">Solutions</span>
            </h1>
            <p className="text-xl text-[#a1a1aa] mb-8">
              Scalable, secure, and customizable background verification solutions for large organizations
              and enterprises.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#a78bfa] text-white px-8 py-4 font-medium hover:bg-[#8b5cf6] transition-colors rounded-lg text-sm"
              >
                Request Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-[#27272a] text-[#fafafa] px-8 py-4 font-medium hover:bg-[#27272a] transition-colors rounded-lg text-sm"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#fafafa] mb-4">Built for Enterprise</h2>
            <p className="text-[#a1a1aa] max-w-2xl mx-auto">
              Everything you need to scale your hiring process with confidence
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-[#18181b] p-8 border border-[#27272a] rounded-xl hover:border-[#a78bfa] transition-colors">
                <div className="w-14 h-14 bg-[#a78bfa]/10 flex items-center justify-center mb-6 rounded-xl">
                  <feature.icon className="w-7 h-7 text-[#a78bfa]" />
                </div>
                <h3 className="text-xl font-bold text-[#fafafa] mb-3">{feature.title}</h3>
                <p className="text-[#a1a1aa]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#fafafa] mb-4">Simple, Transparent Pricing</h2>
            <p className="text-[#a1a1aa] max-w-2xl mx-auto">
              Choose the plan that fits your organization&apos;s needs
            </p>
            <div className="mt-6 flex justify-center">
              <CurrencySelector className="bg-[#27272a] border border-[#27272a] px-2 py-1 rounded-lg" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-[#18181b] p-8 border-2 rounded-xl ${
                  plan.popular ? "border-[#a78bfa]" : "border-[#27272a]"
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#a78bfa] text-white px-4 py-1 text-sm font-medium rounded-lg">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-[#fafafa] mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#fafafa]">
                    {plan.custom ? "Custom" : formatPrice(plan.usd!, currency)}
                  </span>
                  <span className="text-[#a1a1aa]">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                      <span className="text-[#a1a1aa]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 font-medium transition-colors text-sm rounded-lg ${
                    plan.popular
                      ? "bg-[#a78bfa] text-white hover:bg-[#8b5cf6]"
                      : "bg-[#27272a] text-[#fafafa] hover:bg-[#3f3f46]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#a78bfa]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Scale Your Hiring?</h2>
          <p className="text-white/80 mb-8">
            Join 1000+ enterprises already using HireRight for efficient, reliable background screening.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#09090b] text-[#fafafa] px-8 py-4 font-bold hover:bg-[#18181b] transition-colors rounded-lg"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
