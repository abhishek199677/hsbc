"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Send, Clock, Brain, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";

interface Question {
  id: string;
  questionNumber: number;
  question: string;
  category: string;
  skill: string | null;
}

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  category?: string;
  skill?: string | null;
  questionNumber?: number;
  score?: number;
  feedback?: string;
  timestamp: Date;
}

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [sending, setSending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchNextQuestion = async () => {
    try {
      const res = await fetch(`/api/interviews/${id}/next-question`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.success) {
        setCurrentQuestion(data.question);
        setTotalQuestions(data.totalQuestions);
        setTimeRemaining(data.timeRemainingSeconds);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: data.question.question,
            category: data.question.category,
            skill: data.question.skill,
            questionNumber: data.question.questionNumber,
            timestamp: new Date(),
          },
        ]);
      } else {
        setCompleted(true);
      }
    } catch (err) {
      console.error("Failed to fetch question:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!answer.trim() || !currentQuestion || sending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: answer.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    setAnswer("");

    try {
      const res = await fetch(`/api/interviews/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: userMessage.content,
          timeSpentSeconds: 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Show AI feedback
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: data.completed
              ? "Thank you for completing the interview! Generating your results..."
              : data.evaluation?.feedback || "Thank you for your answer.",
            score: data.evaluation?.score,
            feedback: data.evaluation?.feedback,
            timestamp: new Date(),
          },
        ]);

        if (data.completed) {
          setCompleted(true);
          setTimeout(() => {
            router.push(`/interview/${id}/results`);
          }, 2000);
        } else if (data.nextQuestion) {
          setCurrentQuestion(data.nextQuestion);
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              content: data.nextQuestion.question,
              category: data.nextQuestion.category,
              skill: data.nextQuestion.skill,
              questionNumber: data.nextQuestion.questionNumber,
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleEndInterview = async () => {
    try {
      await fetch(`/api/interviews/${id}/end`, {
        method: "POST",
        credentials: "same-origin",
      });
      setCompleted(true);
      router.push(`/interview/${id}/results`);
    } catch (err) {
      console.error("Failed to end interview:", err);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchNextQuestion);
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0 && !completed) {
      void Promise.resolve().then(handleEndInterview);
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, completed]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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
      case "skill_based":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTimelineSegments = () => {
    const total = 15 * 60;
    const elapsed = total - timeRemaining;
    const segments = [
      { label: "15:00", position: 0 },
      { label: "12:00", position: 20 },
      { label: "9:00", position: 40 },
      { label: "6:00", position: 60 },
      { label: "3:00", position: 80 },
      { label: "0:00", position: 100 },
    ];
    return { elapsed: (elapsed / total) * 100, segments };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">AI Interview</span>
              <span className="text-sm text-gray-500">
                Q{currentQuestion?.questionNumber || 0}/{totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeRemaining < 60 ? "bg-red-100 text-red-700" :
                timeRemaining < 180 ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono text-sm font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <button
                onClick={handleEndInterview}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                End Interview
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline bar background */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeRemaining < 60 ? "bg-red-500" :
                  timeRemaining < 180 ? "bg-yellow-500" :
                  "bg-indigo-600"
                }`}
                style={{ width: `${getTimelineSegments().elapsed}%` }}
              />
            </div>
            {/* Timeline labels */}
            <div className="flex justify-between mt-1">
              {getTimelineSegments().segments.map((seg, i) => (
                <span key={i} className="text-[10px] text-gray-400 font-mono">
                  {seg.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Question Progress */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto">
          <div className="h-1 bg-gray-200">
            <div
              className="h-1 bg-indigo-600 transition-all duration-300"
              style={{ width: `${((currentQuestion?.questionNumber || 0) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-900"
              }`}>
                {msg.role === "ai" && msg.category && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(msg.category)}`}>
                      {msg.category.replace("_", " ")}
                    </span>
                    {msg.skill && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {msg.skill}
                      </span>
                    )}
                    {msg.questionNumber && (
                      <span className="text-xs text-gray-400">Q{msg.questionNumber}</span>
                    )}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.score !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      msg.score >= 7 ? "text-emerald-400" : msg.score >= 5 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      Score: {msg.score}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {!completed && (
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                rows={2}
                className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!answer.trim() || sending}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </div>
  );
}
