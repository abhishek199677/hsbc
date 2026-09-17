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
    <section className="relative bg-background overflow-hidden min-h-[90vh] flex items-center">
      {/* Refined ambient gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/[0.02] rounded-full blur-[120px]" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left - Content */}
          <div className="max-w-xl">
            {/* Enterprise badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-full bg-surface border border-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-sm text-muted-foreground font-medium">Trusted by 1,200+ enterprises globally</span>
            </div>

            {/* Headline - Bolder, more impactful */}
            <h1 className="text-[3.25rem] lg:text-[4.5rem] font-bold leading-[1.05] tracking-[-0.02em]">
              <span className="text-foreground">Hire with</span>
              <br />
              <span className="text-foreground">confidence.</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Verify with certainty.
              </span>
            </h1>

            {/* Subtitle - Clearer enterprise value */}
            <p className="mt-8 text-lg text-muted-foreground max-w-md leading-[1.7]">
              AI-powered background screening and talent verification platform built for enterprises that make hiring decisions at scale.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-8 py-4 font-semibold rounded-lg hover:shadow-[0_0_32px_rgba(167,139,250,0.3)] transition-all duration-300 text-sm tracking-wide"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="inline-flex items-center gap-2.5 bg-transparent border border-border text-foreground px-8 py-4 font-medium rounded-lg hover:bg-surface hover:border-primary/30 transition-all duration-300 text-sm"
              >
                <div className="w-7 h-7 border border-border rounded-md flex items-center justify-center bg-surface">
                  <Play className="w-3.5 h-3.5 ml-0.5 text-primary" />
                </div>
                Watch 2-min demo
              </button>
            </div>

            {/* Enterprise metrics bar */}
            <div className="mt-14 grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  <AnimatedCounter target={10} suffix="M+" />
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">Verified candidates</p>
              </div>
              <div>
                <p className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  <AnimatedCounter target={99} suffix=".7%" />
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">Accuracy rate</p>
              </div>
              <div>
                <p className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  <AnimatedCounter target={48} suffix="hr" />
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">Avg. turnaround</p>
              </div>
            </div>
          </div>

          {/* Right - Product Preview */}
          <div className="relative hidden lg:block">
            {/* Main product card */}
            <div className="relative w-full h-[560px] bg-surface border border-border overflow-hidden rounded-2xl shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-md border border-border">
                  <Lock className="w-3 h-3 text-success" />
                  <span className="text-xs text-muted-foreground font-mono">app.techcitta.com/dashboard</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">TC</span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5">
                {/* Welcome header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Good morning,</p>
                    <p className="text-lg font-semibold text-foreground">HSBC Talent Team</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20">Enterprise</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Active Candidates", value: "2,847", change: "+12%", color: "primary" },
                    { label: "Verified Today", value: "156", change: "+8%", color: "success" },
                    { label: "Pending Review", value: "43", change: "-5%", color: "warning" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-background border border-border rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className={`text-[10px] mt-1 text-${stat.color}`}>{stat.change} this week</p>
                    </div>
                  ))}
                </div>

                {/* Candidate list */}
                <div className="bg-background border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Recent Verifications</p>
                    <span className="text-[11px] text-primary">View all</span>
                  </div>
                  {[
                    { name: "Priya Sharma", role: "Sr. Software Engineer", status: "Verified", score: 98 },
                    { name: "Rahul Mehta", role: "Product Manager", status: "In Progress", score: null },
                    { name: "Ananya Patel", role: "Data Scientist", status: "Verified", score: 95 },
                  ].map((candidate, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-surface transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary-hover/20 flex items-center justify-center text-[11px] font-semibold text-primary">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{candidate.name}</p>
                          <p className="text-[11px] text-muted-foreground">{candidate.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {candidate.score && (
                          <span className="text-sm font-semibold text-primary">{candidate.score}</span>
                        )}
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                          candidate.status === 'Verified'
                            ? 'bg-success/10 text-success border border-success/20'
                            : 'bg-warning/10 text-warning border border-warning/20'
                        }`}>
                          {candidate.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating card 1 - Security */}
            <div
              className="absolute -top-4 -right-4 bg-surface border border-border p-4 flex items-center gap-3 rounded-xl shadow-xl animate-float"
              style={{ animationDelay: "0s" }}
            >
              <div className="w-10 h-10 bg-success/10 flex items-center justify-center rounded-lg border border-success/20">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">SOC 2 Compliant</p>
                <p className="text-[11px] text-muted-foreground">Enterprise-grade security</p>
              </div>
            </div>

            {/* Floating card 2 - Speed */}
            <div
              className="absolute top-1/2 -right-6 bg-surface border border-border p-4 flex items-center gap-3 rounded-xl shadow-xl animate-float"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">48hr Turnaround</p>
                <p className="text-[11px] text-muted-foreground">Industry-leading speed</p>
              </div>
            </div>

            {/* Floating card 3 - Scale */}
            <div
              className="absolute -bottom-4 left-1/4 bg-surface border border-border p-4 flex items-center gap-3 rounded-xl shadow-xl animate-float"
              style={{ animationDelay: "3s" }}
            >
              <div className="w-10 h-10 bg-secondary/10 flex items-center justify-center rounded-lg border border-secondary/20">
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">99.7% Accuracy</p>
                <p className="text-[11px] text-muted-foreground">AI-verified results</p>
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
              className="absolute -top-12 right-0 w-10 h-10 bg-surface border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-surface border border-border overflow-hidden rounded-xl">
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
