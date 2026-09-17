"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Mic, Clock, Brain, ChevronRight, ArrowLeft } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  totalExperience: string | null;
  skills: string | null;
}

export default function InterviewSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [format, setFormat] = useState<"text" | "voice">("text");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const fetchCandidate = async () => {
    try {
      const res = await fetch(`/api/agency/candidates`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) {
        const c = data.candidates?.find((c: Candidate) => c.id === id);
        setCandidate(c || null);
      }
    } catch (err) {
      console.error("Failed to fetch candidate:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchCandidate);
  }, []);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ candidateId: id, format }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/interview/${data.interviewId}`);
      } else {
        alert(data.error || data.detail || "Failed to start interview");
      }
    } catch (err) {
      alert("Failed to start interview");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#a1a1aa]">Candidate not found</p>
          <button onClick={() => router.back()} className="mt-4 text-[#a78bfa] hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#a1a1aa] hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-[#a78bfa]" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Interview Setup</h1>
          <p className="text-[#a1a1aa] mt-1">15-minute personalized interview for {candidate.name}</p>
        </div>

        {/* Candidate Info Card */}
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Candidate Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#a1a1aa]">Name</span>
              <p className="font-medium">{candidate.name}</p>
            </div>
            {candidate.currentRole && (
              <div>
                <span className="text-[#a1a1aa]">Role</span>
                <p className="font-medium">{candidate.currentRole}</p>
              </div>
            )}
            {candidate.currentCompany && (
              <div>
                <span className="text-[#a1a1aa]">Company</span>
                <p className="font-medium">{candidate.currentCompany}</p>
              </div>
            )}
            {candidate.totalExperience && (
              <div>
                <span className="text-[#a1a1aa]">Experience</span>
                <p className="font-medium">{candidate.totalExperience}</p>
              </div>
            )}
          </div>
          {candidate.skills && (
            <div className="mt-4">
              <span className="text-[#a1a1aa] text-sm">Skills</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {candidate.skills.split(",").slice(0, 10).map((skill, i) => (
                  <span key={i} className="text-xs bg-[#18181b] text-indigo-700 px-2 py-1 rounded-full">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interview Format Selection */}
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Interview Format</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormat("text")}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                format === "text"
                  ? "border-indigo-500 bg-[#18181b]"
                  : "border-[#27272a] hover:border-gray-300"
              }`}
            >
              <MessageSquare className={`h-6 w-6 mb-2 ${format === "text" ? "text-[#a78bfa]" : "text-[#a1a1aa]"}`} />
              <p className="font-medium text-white">Text Chat</p>
              <p className="text-sm text-[#a1a1aa] mt-1">Type your answers. Works on all devices.</p>
            </button>
            <button
              onClick={() => setFormat("voice")}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                format === "voice"
                  ? "border-indigo-500 bg-[#18181b]"
                  : "border-[#27272a] hover:border-gray-300"
              }`}
            >
              <Mic className={`h-6 w-6 mb-2 ${format === "voice" ? "text-[#a78bfa]" : "text-[#a1a1aa]"}`} />
              <p className="font-medium text-white">Voice Call</p>
              <p className="text-sm text-[#a1a1aa] mt-1">Speak your answers. More realistic.</p>
            </button>
          </div>
        </div>

        {/* Interview Details */}
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">What to Expect</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#a1a1aa]" />
              <span className="text-sm text-gray-700">15 minutes total</span>
            </div>
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-[#a1a1aa]" />
              <span className="text-sm text-gray-700">10 personalized questions based on resume</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-[#a1a1aa]" />
              <span className="text-sm text-gray-700">Mix of technical, behavioral, and project questions</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {starting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              Start Interview
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
