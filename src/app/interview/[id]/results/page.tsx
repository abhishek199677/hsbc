"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Brain, CheckCircle, AlertTriangle, XCircle, Clock, ArrowLeft, MessageSquare, Lock, FileDown, Star, Loader } from "lucide-react";
import PayPalUnlockButton from "@/components/PayPalUnlockButton";
import { generateReportPdf } from "@/lib/generateReportPdf";

interface InterviewData {
  id: string;
  candidateName: string;
  format: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number;
  overallScore: number;
  aiSummary: string | null;
  aiRecommendation: string | null;
  resultsUnlocked?: boolean;
}

interface QuestionData {
  id: string;
  questionNumber: number;
  question: string;
  category: string;
  answer: string | null;
  timeSpentSeconds: number;
  score: number;
  aiFeedback: string | null;
}

interface InterviewSummary {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  interviewPrediction?: string;
}

export default function InterviewResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [resultsUnlocked, setResultsUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("unlocked") === "success";
  });

  const fetchInterview = async () => {
    try {
      const res = await fetch(`/api/interviews/${id}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success) {
        setInterview(data.interview);
        setQuestions(data.questions);
        setResultsUnlocked((prev) => prev || (data.interview.resultsUnlocked ?? false));
      }
    } catch (err) {
      console.error("Failed to fetch interview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchInterview);
    // Clean up URL if unlock was successful
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("unlocked") === "success") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-600 bg-emerald-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec?.toUpperCase()) {
      case "STRONG HIRE":
      case "HIRE":
        return <CheckCircle className="h-6 w-6 text-emerald-600" />;
      case "MAYBE":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <XCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-100 text-blue-700";
      case "behavioral":
        return "bg-purple-100 text-purple-700";
      case "project_based":
        return "bg-green-100 text-green-700";
      case "problem_solving":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-[#27272a] text-[#a1a1aa]";
    }
  };

  const downloadReport = async () => {
    if (!resultsUnlocked) return;
    try {
      const res = await fetch(`/api/interview/${id}/report`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.success && data.report) {
        generateReportPdf(data.report);
      }
    } catch (err) {
      console.error("Failed to download report:", err);
    }
  };

  let summary: InterviewSummary = {};
  try {
    summary = interview?.aiSummary ? JSON.parse(interview.aiSummary) as InterviewSummary : {};
  } catch {}

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#a1a1aa]">Interview not found</p>
          <button onClick={() => router.back()} className="mt-4 text-[#a78bfa] hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#a1a1aa] hover:text-[#a1a1aa] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Score Card */}
        <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 mb-6">
          <div className="text-center mb-6">
            <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              getScoreColor(interview.overallScore)
            }`}>
              <span className="text-3xl font-bold">{interview.overallScore}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{interview.candidateName}</h1>
            <p className="text-[#a1a1aa]">Interview Results</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-[#a1a1aa]">Duration</p>
              <p className="font-medium">{formatDuration(interview.durationSeconds)}</p>
            </div>
            <div>
              <p className="text-sm text-[#a1a1aa]">Questions</p>
              <p className="font-medium">{questions.length}</p>
            </div>
            <div>
              <p className="text-sm text-[#a1a1aa]">Format</p>
              <p className="font-medium capitalize">{interview.format}</p>
            </div>
          </div>
        </div>

        {/* Download button (when unlocked) */}
        {resultsUnlocked && (
          <button
            onClick={downloadReport}
            className="w-full mb-6 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            <FileDown className="w-5 h-5" />
            Download Evaluation Report (PDF)
          </button>
        )}

        {/* Recommendation */}
        {interview.aiRecommendation && (
          <div className="relative bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 mb-6">
            {!resultsUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl backdrop-blur-[2px] z-10">
                <div className="bg-[#18181b] rounded-2xl shadow-xl border border-[#27272a] p-6 max-w-sm w-full text-center">
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-[#a78bfa]" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Unlock Your Results</h4>
                  <p className="text-sm text-[#a1a1aa] mb-1">View your recommendation, strengths, weaknesses, and detailed feedback.</p>
                  <p className="text-2xl font-bold text-[#a78bfa] mb-4">$5.99</p>
                  <PayPalUnlockButton
                    interviewId={id}
                    priceUsd={5.99}
                    onUnlockSuccess={() => {
                      setResultsUnlocked(true);
                      fetchInterview();
                    }}
                  />
                  <p className="text-xs text-[#a1a1aa] mt-3">One-time payment. Results available forever after unlock.</p>
                </div>
              </div>
            )}
            <div className={!resultsUnlocked ? "blur-sm pointer-events-none select-none opacity-60" : ""}>
              <div className="flex items-center gap-3 mb-4">
                {getRecommendationIcon(interview.aiRecommendation)}
                <h2 className="text-lg font-semibold text-white">
                  {interview.aiRecommendation}
                </h2>
              </div>
              {summary.summary && (
                <p className="text-[#a1a1aa] text-sm">{summary.summary}</p>
              )}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="relative">
          {!resultsUnlocked && interview.aiRecommendation && (
            <div className="absolute inset-0 z-10" />
          )}
          <div className={!resultsUnlocked && interview.aiRecommendation ? "blur-sm pointer-events-none select-none opacity-60" : ""}>
            {summary.strengths && summary.strengths.length > 0 && (
              <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 mb-6">
                <h3 className="font-semibold text-white mb-3 text-emerald-600">Strengths</h3>
                <ul className="space-y-2">
                  {summary.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#a1a1aa]">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.weaknesses && summary.weaknesses.length > 0 && (
              <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 mb-6">
                <h3 className="font-semibold text-white mb-3 text-red-600">Areas for Improvement</h3>
                <ul className="space-y-2">
                  {summary.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#a1a1aa]">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interview Prediction */}
            {summary.interviewPrediction && (
              <div className="bg-[#18181b] rounded-xl shadow-sm border border-[#27272a] p-6 mb-6">
                <h3 className="font-semibold text-white mb-3">Interview Prediction</h3>
                <p className="text-sm text-[#a1a1aa]">{summary.interviewPrediction}</p>
              </div>
            )}

            {/* Q&A Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-white mb-4">Question & Answer Details</h3>
              <div className="space-y-3">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="border border-[#27272a] rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedQ(expandedQ === q.questionNumber ? null : q.questionNumber)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#09090b]"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-sm font-medium text-[#a1a1aa]">Q{q.questionNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(q.category)}`}>
                          {q.category.replace("_", " ")}
                        </span>
                        <span className="text-sm text-[#a1a1aa] truncate max-w-md">{q.question}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                          q.score >= 7 ? "bg-emerald-100 text-emerald-700" :
                          q.score >= 5 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {q.score}/10
                        </span>
                      </div>
                    </button>
                    {expandedQ === q.questionNumber && (
                      <div className="px-4 pb-4 border-t border-[#27272a]">
                        <div className="mt-3">
                          <p className="text-sm font-medium text-[#a1a1aa] mb-1">Question</p>
                          <p className="text-sm text-white">{q.question}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-[#a1a1aa] mb-1">Answer</p>
                          <p className="text-sm text-[#a1a1aa] bg-[#09090b] p-3 rounded-lg">
                            {q.answer || "No answer provided"}
                          </p>
                        </div>
                        {q.aiFeedback && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-[#a1a1aa] mb-1">AI Feedback</p>
                            <p className="text-sm text-[#a1a1aa]">{q.aiFeedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
