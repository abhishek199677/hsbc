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
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
              See It In Action
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              See How <span className="text-indigo-600">Techcitta</span> Works
            </h2>
            <p className="text-gray-600 mb-8">
              Watch how our AI-powered platform connects you with the right opportunities in just a few simple steps.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 aspect-video">
              {!isPlaying ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="mb-6">
                        <svg className="w-20 h-20 mx-auto opacity-80" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="2" opacity="0.3" />
                          <path d="M40 30 L70 50 L40 70 Z" fill="white" opacity="0.9" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Techcitta Demo</h3>
                      <p className="text-indigo-100">Watch how it works in 60 seconds</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-10 h-10 text-indigo-600 ml-1" />
                    </div>
                  </button>
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg" />
                </>
              ) : videoError ? (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center text-white p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">Demo video unavailable</h3>
                  <p className="text-indigo-100 text-sm">Please try again later.</p>
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
