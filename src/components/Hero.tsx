"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play, Shield, Zap, Lock, X, Sparkles, CheckCircle2, Building2, Users, TrendingUp } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Hero() {
  const [showVideo, setShowVideo] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <section className="relative bg-[#06060a] overflow-hidden min-h-[90vh] flex items-center">
      {/* Refined ambient gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#a78bfa]/[0.03] rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#f5c542]/[0.02] rounded-full blur-[120px]" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left - Content */}
          <div className="max-w-xl">
            {/* Enterprise badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-full bg-[#13131a] border border-[#1e1e28]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
              </span>
              <span className="text-sm text-[#8b8ba0] font-medium">Trusted by 1,200+ enterprises globally</span>
            </div>

            {/* Headline - Bolder, more impactful */}
            <h1 className="text-[3.25rem] lg:text-[4.5rem] font-bold leading-[1.05] tracking-[-0.02em]">
              <span className="text-[#f8f8fc]">Hire with</span>
              <br />
              <span className="text-[#f8f8fc]">confidence.</span>
              <br />
              <span className="bg-gradient-to-r from-[#a78bfa] via-[#c4b5fd] to-[#f5c542] bg-clip-text text-transparent">
                Verify with certainty.
              </span>
            </h1>

            {/* Subtitle - Clearer enterprise value */}
            <p className="mt-8 text-lg text-[#8b8ba0] max-w-md leading-[1.7]">
              AI-powered background screening and talent verification platform built for enterprises that make hiring decisions at scale.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-[#06060a] px-8 py-4 font-semibold rounded-lg hover:shadow-[0_0_32px_rgba(167,139,250,0.3)] transition-all duration-300 text-sm tracking-wide"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="inline-flex items-center gap-2.5 bg-transparent border border-[#1e1e28] text-[#f8f8fc] px-8 py-4 font-medium rounded-lg hover:bg-[#13131a] hover:border-[#a78bfa]/30 transition-all duration-300 text-sm"
              >
                <div className="w-7 h-7 border border-[#1e1e28] rounded-md flex items-center justify-center bg-[#13131a]">
                  <Play className="w-3.5 h-3.5 ml-0.5 text-[#a78bfa]" />
                </div>
                Watch 2-min demo
              </button>
            </div>

            {/* Enterprise metrics bar */}
            <div className="mt-14 grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl lg:text-4xl font-bold text-[#f8f8fc] tracking-tight">
                  <AnimatedCounter target={10} suffix="M+" />
                </p>
                <p className="text-sm text-[#8b8ba0] mt-1.5">Verified candidates</p>
              </div>
              <div>
                <p className="text-3xl lg:text-4xl font-bold text-[#f8f8fc] tracking-tight">
                  <AnimatedCounter target={99} suffix=".7%" />
                </p>
                <p className="text-sm text-[#8b8ba0] mt-1.5">Accuracy rate</p>
              </div>
              <div>
                <p className="text-3xl lg:text-4xl font-bold text-[#f8f8fc] tracking-tight">
                  <AnimatedCounter target={48} suffix="hr" />
                </p>
                <p className="text-sm text-[#8b8ba0] mt-1.5">Avg. turnaround</p>
              </div>
            </div>
          </div>

          {/* Right - Product Preview */}
          <div className="relative hidden lg:block">
            {/* Main product card */}
            <div className="relative w-full h-[560px] bg-[#13131a] border border-[#1e1e28] overflow-hidden rounded-2xl shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e1e28] bg-[#0f0f16]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]/80" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#13131a] rounded-md border border-[#1e1e28]">
                  <Lock className="w-3 h-3 text-[#22c55e]" />
                  <span className="text-xs text-[#8b8ba0] font-mono">app.techcitta.com/dashboard</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#06060a]">TC</span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5">
                {/* Welcome header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-[#8b8ba0]">Good morning,</p>
                    <p className="text-lg font-semibold text-[#f8f8fc]">HSBC Talent Team</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium rounded-full border border-[#22c55e]/20">Enterprise</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Active Candidates", value: "2,847", change: "+12%", color: "#a78bfa" },
                    { label: "Verified Today", value: "156", change: "+8%", color: "#22c55e" },
                    { label: "Pending Review", value: "43", change: "-5%", color: "#f59e0b" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#0f0f16] border border-[#1e1e28] rounded-lg p-3">
                      <p className="text-[11px] text-[#8b8ba0] mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-[#f8f8fc]">{stat.value}</p>
                      <p className="text-[10px] mt-1" style={{ color: stat.color }}>{stat.change} this week</p>
                    </div>
                  ))}
                </div>

                {/* Candidate list */}
                <div className="bg-[#0f0f16] border border-[#1e1e28] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1e1e28] flex items-center justify-between">
                    <p className="text-sm font-medium text-[#f8f8fc]">Recent Verifications</p>
                    <span className="text-[11px] text-[#a78bfa]">View all</span>
                  </div>
                  {[
                    { name: "Priya Sharma", role: "Sr. Software Engineer", status: "Verified", score: 98 },
                    { name: "Rahul Mehta", role: "Product Manager", status: "In Progress", score: null },
                    { name: "Ananya Patel", role: "Data Scientist", status: "Verified", score: 95 },
                  ].map((candidate, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e28] last:border-0 hover:bg-[#13131a] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a78bfa]/20 to-[#8b5cf6]/20 flex items-center justify-center text-[11px] font-semibold text-[#a78bfa]">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#f8f8fc]">{candidate.name}</p>
                          <p className="text-[11px] text-[#8b8ba0]">{candidate.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {candidate.score && (
                          <span className="text-sm font-semibold text-[#a78bfa]">{candidate.score}</span>
                        )}
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                          candidate.status === 'Verified'
                            ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                            : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
                        }`}>
                          {candidate.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating card 1 - Security */}
            <div
              className="absolute -top-4 -right-4 bg-[#13131a] border border-[#1e1e28] p-4 flex items-center gap-3 rounded-xl shadow-xl animate-float"
              style={{ animationDelay: "0s" }}
            >
              <div className="w-10 h-10 bg-[#22c55e]/10 flex items-center justify-center rounded-lg border border-[#22c55e]/20">
                <Shield className="w-5 h-5 text-[#22c55e]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f8f8fc]">SOC 2 Compliant</p>
                <p className="text-[11px] text-[#8b8ba0]">Enterprise-grade security</p>
              </div>
            </div>

            {/* Floating card 2 - Speed */}
            <div
              className="absolute top-1/2 -right-6 bg-[#13131a] border border-[#1e1e28] p-4 flex items-center gap-3 rounded-xl shadow-xl animate-float"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="w-10 h-10 bg-[#a78bfa]/10 flex items-center justify-center rounded-lg border border-[#a78bfa]/20">
                <Zap className="w-5 h-5 text-[#a78bfa]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f8f8fc]">48hr Turnaround</p>
                <p className="text-[11px] text-[#8b8ba0]">Industry-leading speed</p>
              </div>
            </div>

            {/* Floating card 3 - Scale */}
            <div
              className="absolute -bottom-4 left-1/4 bg-[#13131a] border border-[#1e1e28] p-4 flex items-center gap-3 rounded-xl shadow-xl animate-float"
              style={{ animationDelay: "3s" }}
            >
              <div className="w-10 h-10 bg-[#f5c542]/10 flex items-center justify-center rounded-lg border border-[#f5c542]/20">
                <TrendingUp className="w-5 h-5 text-[#f5c542]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f8f8fc]">99.7% Accuracy</p>
                <p className="text-[11px] text-[#8b8ba0]">AI-verified results</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 w-10 h-10 bg-[#13131a] border border-[#1e1e28] rounded-lg flex items-center justify-center text-[#8b8ba0] hover:text-[#f8f8fc] hover:border-[#a78bfa]/30 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-[#13131a] border border-[#1e1e28] overflow-hidden rounded-xl">
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
