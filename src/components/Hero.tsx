"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Shield, Zap, Lock, X } from "lucide-react";
import { useGlare } from "@/lib/useGlare";

export default function Hero() {
  const [showVideo, setShowVideo] = useState(false);
  const { onMouseMove } = useGlare<HTMLDivElement>();

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl aura" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl aura" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/90">Trusted by 1000+ organizations worldwide</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
              Your Dream Job
              <br />
              Deserves the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
                Right
              </span>
              <br />
              Start.
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-lg">
              AI-powered background screening you can trust. 
              Confidence you can carry into your future. 
              Verified by top employers globally.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="glare glare-light inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-full font-medium hover:from-red-700 hover:to-pink-700 transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="glare inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-3">
                {["A", "B", "C", "D", "E"].map((letter, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-medium">
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
                <p className="text-sm text-gray-300 mt-1">
                  <span className="font-semibold text-white">4.9/5</span> from 10,000+ users
                </p>
              </div>
            </div>
          </div>
          <div className="relative hidden lg:block" onMouseMove={onMouseMove}>
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden card-glare">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=500&fit=crop"
                alt="Professional woman"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating cards */}
            <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-5 shadow-2xl flex items-center gap-4 animate-bounce hover:shadow-indigo-200/80 transition-shadow" style={{ animationDuration: "3s" }}>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Fast & Secure</p>
                <p className="text-xs text-gray-500">Quick turnaround</p>
              </div>
            </div>
            <div className="absolute top-1/2 -right-10 bg-white rounded-2xl p-5 shadow-2xl flex items-center gap-4" style={{ animation: "bounce 4s infinite" }}>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Trusted by</p>
                <p className="text-xs text-gray-500">Top Employers</p>
              </div>
            </div>
            <div className="absolute -bottom-6 left-1/4 bg-white rounded-2xl p-5 shadow-2xl flex items-center gap-4" style={{ animation: "bounce 5s infinite" }}>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Your Privacy</p>
                <p className="text-xs text-gray-500">Always Protected</p>
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
              className="absolute -top-12 right-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
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
