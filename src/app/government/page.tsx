"use client";

import Link from "next/link";
import { Shield, CheckCircle, ArrowRight, Building, Users, Lock, FileCheck, Globe, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "National Security Clearance",
    description: "Automated verification for security-sensitive positions with multi-layered background checks.",
  },
  {
    icon: FileCheck,
    title: "Document Verification",
    description: "AI-powered document authentication detecting fraud and forgery in real-time.",
  },
  {
    icon: Users,
    title: "Bulk Processing",
    description: "Process thousands of verifications simultaneously with our enterprise-grade infrastructure.",
  },
  {
    icon: Lock,
    title: "Data Sovereignty",
    description: "Deployment and data-location requirements are reviewed and agreed for each customer environment.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Available in 22+ Indian languages and 50+ global languages for inclusive access.",
  },
  {
    icon: Award,
    title: "Compliance Ready",
    description: "Pre-built templates for government regulations and international standards.",
  },
];

const stats = [
  { number: "50+", label: "Government Departments" },
  { number: "10M+", label: "Verifications Completed" },
  { number: "24/7", label: "Workflow Access" },
  { number: "< 24hrs", label: "Average Turnaround" },
];

export default function GovernmentPage() {
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
            <div className="inline-flex items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/30 px-4 py-2 mb-6 rounded-lg">
              <Shield className="w-4 h-4 text-[#22c55e]" />
              <span className="text-sm text-[#fafafa]">Trusted by Government of India</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#fafafa] mb-6">
              Government <span className="text-[#a78bfa]">Solutions</span>
            </h1>
            <p className="text-xl text-[#a1a1aa] mb-8">
              Secure, compliant, and scalable background verification solutions designed specifically
              for government departments and public sector organizations.
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

      {/* Stats */}
      <section className="py-16 bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-[#a78bfa]">{stat.number}</p>
                <p className="text-[#a1a1aa] mt-2 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#fafafa] mb-4">Government-Grade Features</h2>
            <p className="text-[#a1a1aa] max-w-2xl mx-auto">
              Purpose-built for the security and compliance requirements of government operations
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

      {/* CTA */}
      <section className="py-20 bg-[#a78bfa]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Verification Process?</h2>
          <p className="text-white/80 mb-8">
            Join 50+ government departments already using HireRight for secure, efficient background screening.
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
