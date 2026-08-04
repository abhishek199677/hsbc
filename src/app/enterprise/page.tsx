"use client";

import Link from "next/link";
import { Building2, CheckCircle, ArrowRight, Users, Zap, Lock, BarChart3, Globe, Headphones } from "lucide-react";

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
    price: "₹9,999",
    period: "/month",
    features: ["Up to 100 verifications", "Basic analytics", "Email support", "API access"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Business",
    price: "₹49,999",
    period: "/month",
    features: ["Up to 1,000 verifications", "Advanced analytics", "Priority support", "Custom integrations", "Dedicated account manager"],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited verifications", "Enterprise analytics", "24/7 support", "Custom workflows", "SLA guarantee", "On-premise option"],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-white/90">Enterprise-Grade Solutions</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Enterprise <span className="text-indigo-400">Solutions</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Scalable, secure, and customizable background verification solutions for large organizations 
              and enterprises.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-medium hover:bg-indigo-700 transition-colors"
              >
                Request Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-colors"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for Enterprise</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to scale your hiring process with confidence
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your organization's needs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl p-8 border-2 ${
                  plan.popular ? "border-indigo-600 shadow-xl" : "border-gray-100"
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-full font-medium transition-colors ${
                    plan.popular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
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
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Scale Your Hiring?</h2>
          <p className="text-white/80 mb-8">
            Join 1000+ enterprises already using HireRight for efficient, reliable background screening.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
