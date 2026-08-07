"use client";

import Link from "next/link";
import { CheckCircle, Sparkles } from "lucide-react";
import { PLAN_PRICES_USD, formatPrice } from "@/lib/pricing";
import { useCurrency } from "@/lib/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    period: "forever",
    description: "For trying out the AI interview platform.",
    features: [
      "3 interviews / month",
      "1 candidate profile",
      "Email confirmation",
      "Basic AI evaluation",
    ],
    highlighted: false,
    cta: "Start Free",
    href: "/signup",
  },
  {
    id: "pro",
    name: "Pro",
    period: "/month",
    description: "For growing teams that screen regularly.",
    features: [
      "100 interviews / month",
      "Full video & analytics",
      "Email + WhatsApp reminders",
      "Priority AI evaluations",
      "6-month video retention",
    ],
    highlighted: true,
    cta: "Choose Pro",
    href: "/signup",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    period: "/month",
    description: "For organizations with high-volume hiring.",
    features: [
      "Unlimited interviews",
      "Everything in Pro",
      "Custom branding & roles",
      "1-year video retention",
      "Priority support",
    ],
    highlighted: false,
    cta: "Choose Enterprise",
    href: "/signup",
  },
];

export default function PricingPage() {
  const { currency } = useCurrency();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more interviews. No hidden fees, cancel anytime.
          </p>
          <div className="mt-6 flex justify-center">
            <CurrencySelector className="bg-white/5 rounded-lg px-2 py-1" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-white shadow-2xl scale-105 border-2 border-indigo-400"
                  : "bg-white/95"
              }`}
            >
              {plan.highlighted && (
                <div className="flex items-center gap-1 text-indigo-600 text-xs font-semibold uppercase tracking-wide mb-2">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(PLAN_PRICES_USD[plan.id].monthly, currency)}
                </span>
                <span className="text-gray-500"> {plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`text-center py-3 rounded-lg font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-gray-300 text-gray-800 hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-400 text-sm mt-10">
          Questions? Reach out at{" "}
          <a href="mailto:support@techcitta.com" className="text-slate-200 underline">
            support@techcitta.com
          </a>
        </p>
      </div>
    </div>
  );
}
