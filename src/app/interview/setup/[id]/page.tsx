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

  useEffect(() => {
    fetchCandidate();
  }, []);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Candidate not found</p>
          <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Interview Setup</h1>
          <p className="text-gray-500 mt-1">15-minute personalized interview for {candidate.name}</p>
        </div>

        {/* Candidate Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Candidate Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name</span>
              <p className="font-medium">{candidate.name}</p>
            </div>
            {candidate.currentRole && (
              <div>
                <span className="text-gray-500">Role</span>
                <p className="font-medium">{candidate.currentRole}</p>
              </div>
            )}
            {candidate.currentCompany && (
              <div>
                <span className="text-gray-500">Company</span>
                <p className="font-medium">{candidate.currentCompany}</p>
              </div>
            )}
            {candidate.totalExperience && (
              <div>
                <span className="text-gray-500">Experience</span>
                <p className="font-medium">{candidate.totalExperience}</p>
              </div>
            )}
          </div>
          {candidate.skills && (
            <div className="mt-4">
              <span className="text-gray-500 text-sm">Skills</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {candidate.skills.split(",").slice(0, 10).map((skill, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interview Format Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Interview Format</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormat("text")}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                format === "text"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <MessageSquare className={`h-6 w-6 mb-2 ${format === "text" ? "text-indigo-600" : "text-gray-400"}`} />
              <p className="font-medium text-gray-900">Text Chat</p>
              <p className="text-sm text-gray-500 mt-1">Type your answers. Works on all devices.</p>
            </button>
            <button
              onClick={() => setFormat("voice")}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                format === "voice"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Mic className={`h-6 w-6 mb-2 ${format === "voice" ? "text-indigo-600" : "text-gray-400"}`} />
              <p className="font-medium text-gray-900">Voice Call</p>
              <p className="text-sm text-gray-500 mt-1">Speak your answers. More realistic.</p>
            </button>
          </div>
        </div>

        {/* Interview Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">What to Expect</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">15 minutes total</span>
            </div>
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">10 personalized questions based on resume</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
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
