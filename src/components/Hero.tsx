"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Shield, Zap, Lock, X, Sparkles } from "lucide-react";
import { useGlare } from "@/lib/useGlare";

export default function Hero() {
  const [showVideo, setShowVideo] = useState(false);
  const { onMouseMove } = useGlare<HTMLDivElement>();

  return (
    <section className="relative bg-[#0a0a1a] overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] aura" />
        <div className="absolute bottom-10 right-[5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] aura" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-300">AI-Powered Background Screening</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              <span className="text-white">Your Dream Job</span>
              <br />
              <span className="text-white">Deserves the </span>
              <span className="gradient-text-warm">Right</span>
              <br />
              <span className="text-white">Start.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-8 text-lg text-gray-400 max-w-lg leading-relaxed">
              AI-powered background screening you can trust.
              Confidence you can carry into your future.
              Verified by top employers globally.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="glare glare-light inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="glare glass inline-flex items-center gap-2 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/5 transition-all"
              >
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {["A", "B", "C", "D", "E"].map((letter, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-[#0a0a1a] flex items-center justify-center text-white text-xs font-medium"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  <span className="font-semibold text-white">4.9/5</span> from 10,000+ users
                </p>
              </div>
            </div>
          </div>

          {/* Right side — floating glass cards */}
          <div className="relative hidden lg:block" onMouseMove={onMouseMove}>
            <div className="relative w-full h-[520px] rounded-3xl overflow-hidden card-glare glass">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=500&fit=crop"
                alt="Professional woman"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent" />
            </div>

            {/* Floating card 1 */}
            <div
              className="absolute -top-6 -right-6 glass-card rounded-2xl p-5 flex items-center gap-4 animate-float"
              style={{ animationDelay: "0s" }}
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Fast & Secure</p>
                <p className="text-xs text-gray-400">Quick turnaround</p>
              </div>
            </div>

            {/* Floating card 2 */}
            <div
              className="absolute top-1/2 -right-10 glass-card rounded-2xl p-5 flex items-center gap-4 animate-float"
              style={{ animationDelay: "1s" }}
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Trusted by</p>
                <p className="text-xs text-gray-400">Top Employers</p>
              </div>
            </div>

            {/* Floating card 3 */}
            <div
              className="absolute -bottom-6 left-1/4 glass-card rounded-2xl p-5 flex items-center gap-4 animate-float"
              style={{ animationDelay: "2s" }}
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Your Privacy</p>
                <p className="text-xs text-gray-400">Always Protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl glass">
              <video
                className="w-full aspect-video"
                src="/videos/demo.mp4"
                controls
                autoPlay
                muted
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
