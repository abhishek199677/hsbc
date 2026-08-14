"use client";

import Link from "next/link";
import { ArrowRight, Star, CheckCircle } from "lucide-react";
import { useGlare } from "@/lib/useGlare";

export default function CTA() {
  const { onMouseMove } = useGlare<HTMLDivElement>();
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl aura" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl aura" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-12 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Take the <span className="text-yellow-300">Right</span> Step Today
              </h2>
              <p className="text-white/80 mb-6">
                Join millions of job seekers who trust HireRight for their career journey. 
                Get verified, get matched, get hired.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "AI-powered matching with the right roles",
                  "100% secure & privacy-first",
                  "Trusted by top companies globally",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span className="text-white/90">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="glare glare-light inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-white/20"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="space-y-6" onMouseMove={onMouseMove}>
              <div className="card-glare bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">4.9</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/30" />
                  <div>
                    <p className="text-white font-medium">Job Seeker Rating</p>
                    <p className="text-white/60 text-sm">Based on 10,000+ reviews</p>
                  </div>
                </div>
              </div>
              <div className="card-glare bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">4.8</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/30" />
                  <div>
                    <p className="text-white font-medium">Employer Rating</p>
                    <p className="text-white/60 text-sm">Trusted by 1000+ companies</p>
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
