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
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/90">Trusted by Government of India</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Government <span className="text-indigo-400">Solutions</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Secure, compliant, and scalable background verification solutions designed specifically 
              for government departments and public sector organizations.
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

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-indigo-600">{stat.number}</p>
                <p className="text-gray-600 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Government-Grade Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Purpose-built for the security and compliance requirements of government operations
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

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Verification Process?</h2>
          <p className="text-white/80 mb-8">
            Join 50+ government departments already using HireRight for secure, efficient background screening.
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
