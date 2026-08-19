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
    <section className="py-24 bg-[#0a0a1a] relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block px-4 py-2 glass rounded-full text-sm font-medium mb-4 text-indigo-400">
              See It In Action
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              <span className="text-white">See How </span>
              <span className="gradient-text">HireRight</span>
              <span className="text-white"> Works</span>
            </h2>
            <p className="text-gray-400 mb-8 text-lg leading-relaxed">
              Watch how our AI-powered platform connects you with the right opportunities in just a few simple steps.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden glass border border-white/10 aspect-video">
              {!isPlaying ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mb-6">
                        <svg className="w-20 h-20 mx-auto opacity-60" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="2" opacity="0.3" />
                          <path d="M40 30 L70 50 L40 70 Z" fill="white" opacity="0.9" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">HireRight Demo</h3>
                      <p className="text-gray-400">Watch how it works in 60 seconds</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="glare glare-light w-24 h-24 glass rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                  </button>
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-lg" />
                </>
              ) : videoError ? (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Demo video unavailable</h3>
                  <p className="text-gray-400 text-sm">Please try again later.</p>
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
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
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
