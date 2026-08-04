"use client";

import Link from "next/link";
import { User, FileCheck, CheckCircle, Briefcase, ArrowRight } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: User,
    title: "Create Your Profile",
    description: "Sign up in minutes and share your professional details securely.",
    color: "bg-gradient-to-br from-red-500 to-pink-500",
    shadowColor: "shadow-red-500/30",
  },
  {
    number: 2,
    icon: FileCheck,
    title: "AI-Powered Screening",
    description: "Our advanced AI verifies your information quickly & accurately.",
    color: "bg-gradient-to-br from-indigo-500 to-purple-500",
    shadowColor: "shadow-indigo-500/30",
  },
  {
    number: 3,
    icon: CheckCircle,
    title: "Get Matched",
    description: "Receive personalized job matches based on your skills and preferences.",
    color: "bg-gradient-to-br from-green-500 to-emerald-500",
    shadowColor: "shadow-green-500/30",
  },
  {
    number: 4,
    icon: Briefcase,
    title: "Land Your Dream Job",
    description: "Move forward with confidence. More trust. More opportunities.",
    color: "bg-gradient-to-br from-orange-500 to-amber-500",
    shadowColor: "shadow-orange-500/30",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How <span className="text-indigo-600">HireRight</span> Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get verified and matched with the right opportunities in just 4 simple steps
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-red-500 via-indigo-500 via-green-500 to-orange-500 rounded-full" />
          {steps.map((step) => (
            <div key={step.number} className="text-center relative group">
              <div className={`w-32 h-32 ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10 shadow-xl ${step.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-14 h-14 text-white" />
              </div>
              <div className="text-sm font-bold text-indigo-600 mb-2">Step {step.number}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 max-w-[200px] mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
          >
            Start Your Journey
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
