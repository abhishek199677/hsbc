"use client";

import Link from "next/link";
import { ArrowRight, Star, CheckCircle } from "lucide-react";
import { useGlare } from "@/lib/useGlare";

export default function CTA() {
  const { onMouseMove } = useGlare<HTMLDivElement>();
  return (
    <section className="py-24 bg-[#0a0a1a] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] aura" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] aura" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="glass-card rounded-3xl p-8 lg:p-12 border border-white/10 overflow-hidden relative">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none" />

          <div className="grid lg:grid-cols-2 gap-10 items-center relative">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold mb-4">
                <span className="text-white">Take the </span>
                <span className="gradient-text-warm">Right</span>
                <span className="text-white"> Step Today</span>
              </h2>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                Join millions of job seekers who trust HireRight for their career journey.
                Get verified, get matched, get hired.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  "AI-powered matching with the right roles",
                  "100% secure & privacy-first",
                  "Trusted by top companies globally",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="glare glare-light inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-full font-bold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="space-y-6" onMouseMove={onMouseMove}>
              <div className="glass-card card-glare rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold gradient-text">4.9</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div>
                    <p className="text-white font-medium">Job Seeker Rating</p>
                    <p className="text-gray-400 text-sm">Based on 10,000+ reviews</p>
                  </div>
                </div>
              </div>
              <div className="glass-card card-glare rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold gradient-text">4.8</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div>
                    <p className="text-white font-medium">Employer Rating</p>
                    <p className="text-gray-400 text-sm">Trusted by 1000+ companies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
