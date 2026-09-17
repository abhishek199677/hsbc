"use client";

import { useState } from "react";
import { Play, X, CheckCircle } from "lucide-react";

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const benefits = [
    "AI-powered job matching",
    "15-minute video interviews",
    "Instant background verification",
    "Real-time progress tracking",
  ];

  return (
    <section className="py-24 bg-[#09090b] relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[400px] h-[400px] bg-[#a78bfa]/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-sm font-medium mb-4 text-[#a78bfa]">
              See It In Action
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              <span className="text-[#fafafa]">See How </span>
              <span className="text-[#a78bfa]">HireRight</span>
              <span className="text-[#fafafa]"> Works</span>
            </h2>
            <p className="text-[#a1a1aa] mb-8 text-lg leading-relaxed">
              Watch how our AI-powered platform connects you with the right opportunities in just a few simple steps.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                  <span className="text-[#a1a1aa]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden bg-[#18181b] border border-[#27272a] aspect-video">
              {!isPlaying ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/20 to-[#f5c542]/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mb-6">
                        <svg className="w-20 h-20 mx-auto opacity-60" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="48" stroke="#a78bfa" strokeWidth="2" opacity="0.3" />
                          <path d="M40 30 L70 50 L40 70 Z" fill="#a78bfa" opacity="0.9" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-[#fafafa] mb-2">HireRight Demo</h3>
                      <p className="text-[#a1a1aa]">Watch how it works in 60 seconds</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="w-24 h-24 bg-[#18181b]/80 backdrop-blur-sm border border-[#27272a] rounded-full flex items-center justify-center group-hover:scale-110 group-hover:border-[#a78bfa] transition-all duration-300 shadow-lg">
                      <Play className="w-10 h-10 text-[#fafafa] ml-1" />
                    </div>
                  </button>
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#a78bfa]/20 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#a78bfa]/20 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#a78bfa]/20 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#a78bfa]/20 rounded-br-lg" />
                </>
              ) : videoError ? (
                <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/20 to-[#f5c542]/10 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-xl font-bold text-[#fafafa] mb-2">Demo video unavailable</h3>
                  <p className="text-[#a1a1aa] text-sm">Please try again later.</p>
                </div>
              ) : (
                <>
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src="/videos/demo.mp4"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onError={() => setVideoError(true)}
                  />
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setVideoError(false);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-[#fafafa] hover:bg-black/70 transition-colors duration-200 z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
