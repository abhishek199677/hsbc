"use client";

import { Shield, Zap, Lock, UserCheck, Star, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Trusted & Reliable",
    description: "Accurate background checks that help build employer trust.",
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    icon: Zap,
    title: "AI-Powered Speed",
    description: "Quick & digital process that keeps you ahead in the hiring race.",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your data is protected with industry-leading security standards.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    icon: UserCheck,
    title: "Stay Job-Ready",
    description: "A verified profile makes you a more confident candidate.",
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Star,
    title: "Global Standards",
    description: "Screening aligned with global compliance & quality benchmarks.",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

const stats = [
  { number: "10M+", label: "Verified Candidates" },
  { number: "1000+", label: "Partner Companies" },
  { number: "99.9%", label: "Accuracy Rate" },
  { number: "24/7", label: "AI Support" },
];

export default function Features() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Job Seekers Choose <span className="text-indigo-600">HireRight</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We provide the tools and trust you need to advance your career
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
              <p className="text-3xl lg:text-4xl font-bold text-indigo-600">{stat.number}</p>
              <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: "ISO 27001 Certified" },
              { icon: Lock, label: "GDPR Compliant" },
              { icon: CheckCircle, label: "SOC 2 Type II" },
              { icon: Star, label: "99.9% Uptime" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <badge.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
