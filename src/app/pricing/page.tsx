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
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#fafafa] mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-[#a1a1aa] text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more interviews. No hidden fees, cancel anytime.
          </p>
          <div className="mt-6 flex justify-center">
            <CurrencySelector className="bg-[#18181b] border border-[#27272a] px-2 py-1 rounded-lg" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`p-8 flex flex-col rounded-xl ${
                plan.highlighted
                  ? "bg-[#18181b] border-2 border-[#a78bfa] scale-105"
                  : "bg-[#18181b] border border-[#27272a]"
              }`}
            >
              {plan.highlighted && (
                <div className="flex items-center gap-1 text-[#a78bfa] text-xs font-semibold mb-2">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}
              <h2 className="text-xl font-bold text-[#fafafa] mb-1">{plan.name}</h2>
              <p className="text-sm text-[#a1a1aa] mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#fafafa]">
                  {formatPrice(PLAN_PRICES_USD[plan.id].monthly, currency)}
                </span>
                <span className="text-[#a1a1aa]"> {plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[#a1a1aa]">
                    <CheckCircle className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`text-center py-3 font-medium transition-colors text-sm rounded-lg ${
                  plan.highlighted
                    ? "bg-[#a78bfa] text-white hover:bg-[#8b5cf6]"
                    : "border border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[#a1a1aa] text-sm mt-10">
          Questions? Reach out at{" "}
          <a href="mailto:support@hireright.com" className="text-[#f5c542] underline">
            support@hireright.com
          </a>
        </p>
      </div>
    </div>
  );
}
