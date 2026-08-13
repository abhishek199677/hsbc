"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import StepIndicator from "@/components/StepIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { timezoneLabel } from "@/lib/timezone";
import { CheckCircle, Calendar, Clock, Video, Info, Mail, MessageCircle, ChevronRight, Shield, Star, X, ArrowRight } from "lucide-react";

const steps = [
  { number: 1, label: "Profile", sublabel: "Tell us who you are" },
  { number: 2, label: "Resume", sublabel: "Your expertise" },
  { number: 3, label: "About You", sublabel: "What you're looking for" },
  { number: 4, label: "Availability", sublabel: "Let's get you ready" },
  { number: 5, label: "AI Interview", sublabel: "Let's get you ready" },
  { number: 6, label: "All Set!", sublabel: "You're all set!" },
];

interface InterviewData {
  date: string;
  time: string;
  emailSent?: boolean;
  whatsappSent?: boolean;
  reminder24hSent?: boolean;
  reminder1hSent?: boolean;
  reminder15mSent?: boolean;
  reminderNowSent?: boolean;
  [key: string]: unknown;
}

interface ProfileData {
  phone?: string | null;
  timezone?: string | null;
  [key: string]: unknown;
}

export default function ConfirmationPage() {
  const { user, token } = useAuth();
  const [currentStep] = useState(6);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const progress = Math.round((currentStep / steps.length) * 100);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const [interviewRes, profileRes] = await Promise.all([
          fetch("/api/interview", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const interviewData = await interviewRes.json();
        const profileData = await profileRes.json();
        if (cancelled) return;
        if (interviewData.success && interviewData.interview) {
          setInterview(interviewData.interview as InterviewData);
        }
        if (profileData.success && profileData.profile) {
          setProfile(profileData.profile as ProfileData);
        }
      } catch (error) {
        console.error("Failed to fetch interview details:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const displayName = user?.name || "there";
  const displayEmail = user?.email || "your email";
  const displayPhone = user?.phone || profile?.phone || "Not provided";
  const interviewDate = interview?.date || "2025-05-19";
  const interviewTime = interview?.time || "01:30 PM";
  const tzLabel = timezoneLabel(profile?.timezone || "Asia/Kolkata");

  const addToCalendar = () => {
    const dateStr = interviewDate.replace(/-/g, "");
    const timeMatch = interviewTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) return;

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const end = new Date(2000, 0, 1, hours, minutes + 15);
    const pad = (n: number) => String(n).padStart(2, "0");
    const startTimeStr = `${pad(hours)}${pad(minutes)}00`;
    const endTimeStr = `${pad(end.getHours())}${pad(end.getMinutes())}00`;

    const title = encodeURIComponent("HireRight AI Interview");
    const details = encodeURIComponent(`Your 15-minute AI interview with HireRight.\n\nMode: AI Video Interview\nType: Technical + Behavioral Assessment\n\nWe look forward to meeting you!\n– Team HireRight`);
    const location = encodeURIComponent("Online - AI Video Interview");
    
    // Google Calendar link
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T${startTimeStr}/${dateStr}T${endTimeStr}&details=${details}&location=${location}`;
    
    window.open(googleUrl, "_blank");
  };

  const interviewGuide = {
    technical: [
      "Review your resume and be ready to discuss your projects in detail",
      "Prepare examples of technical challenges you've solved",
      "Be ready to explain your problem-solving approach",
      "Know your tech stack and be honest about areas you're still learning",
    ],
    behavioral: [
      "Use the STAR method (Situation, Task, Action, Result) for answers",
      "Prepare examples of teamwork and leadership",
      "Be ready to discuss how you handle challenges and conflicts",
      "Show enthusiasm for learning and growth",
    ],
    general: [
      "Test your camera and microphone before the interview",
      "Find a quiet, well-lit space with minimal distractions",
      "Dress professionally even for a virtual interview",
      "Keep your resume handy for reference during the conversation",
      "Prepare thoughtful questions about the role and company",
      "Be authentic - the AI adapts to your responses",
    ],
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar currentStep={currentStep} progress={progress} />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-4 bg-white border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-600" />
            Your data is safe with us
          </div>
            <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium">Hi, {displayName} 👋</span>
          </div>
        </div>
        <StepIndicator steps={steps} currentStep={currentStep} />
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 flex items-center gap-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">All Set, {displayName}! 🎉</h3>
              <p className="text-lg font-semibold text-gray-900">Your 15-Minute AI Interview is Confirmed!</p>
              <p className="text-sm text-gray-600 mt-1">We&apos;re excited to connect with you and help you take the next step in your career journey.</p>
            </div>
            <div className="hidden lg:block w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🤖</span>
            </div>
          </div>

          {/* Start Live Interview CTA */}
          <div className="bg-white rounded-xl border p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ready when you are!</p>
                <p className="text-sm text-gray-500">Start your 15-minute AI video interview now.</p>
              </div>
            </div>
            <Link
              href="/interview/room"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
            >
              Start Live Interview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interview Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Interview Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(interviewDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-sm font-medium text-gray-900">{interviewTime} ({tzLabel}) <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">15 Min Interview</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Interview Mode</p>
                    <p className="text-sm font-medium text-gray-900">AI Video Interview</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Interview Type</p>
                    <p className="text-sm font-medium text-gray-900">Technical + Behavioral Assessment</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={addToCalendar}
                className="w-full mt-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Add to Calendar
              </button>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s Next?</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Our AI will conduct a fair and personalized conversation to understand you better.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Showcase your skills, experiences and problem-solving approach.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Get matched with opportunities that are the right fit for you.</span>
                </li>
              </ul>
              <button 
                onClick={() => setShowGuide(true)}
                className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                View Interview Guide
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confirmation Sent */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">We&apos;ve Sent You a Confirmation!</h3>
            <p className="text-sm text-gray-500">Check your email and WhatsApp for all the details.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Email */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">Email</span>
                </div>
                {interview?.emailSent ? (
                  <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Sent</span>
                ) : (
                  <span className="text-xs text-gray-500">Not sent</span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                <p>To: <span className="text-gray-900">{displayEmail}</span></p>
                <p>Subject: <span className="text-gray-900">Your AI Interview is Confirmed – {formatShortDate(interviewDate)}</span></p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                <p>Hi {displayName},</p>
                <p className="mt-2">Great news! Your 15-minute AI interview is confirmed.</p>
                <p className="mt-2">📅 Date: {formatDate(interviewDate)}</p>
                <p>🕐 Time: {interviewTime} ({tzLabel})</p>
                <p className="mt-2">We look forward to meeting you!</p>
                <p className="mt-2 text-gray-500">– Team Techcitta</p>
              </div>
              <button 
                onClick={() => {
                  const subject = encodeURIComponent(`Your AI Interview is Confirmed – ${formatShortDate(interviewDate)}`);
                  const body = encodeURIComponent(`Hi ${displayName},\n\nGreat news! Your 15-minute AI interview is confirmed.\n\n📅 Date: ${formatDate(interviewDate)}\n🕐 Time: ${interviewTime} (${tzLabel})\n\nWe look forward to meeting you!\n\n– Team Techcitta`);
                  window.open(`mailto:${displayEmail}?subject=${subject}&body=${body}`, "_blank");
                }}
                className="w-full mt-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Open Email
              </button>
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">WhatsApp</span>
                </div>
                {interview?.whatsappSent ? (
                  <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Sent</span>
                ) : (
                  <span className="text-xs text-gray-500">Not sent</span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                <p>To: <span className="text-gray-900">{displayPhone}</span></p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700">
                <p>Hi {displayName}! 👋</p>
                <p className="mt-2">Your 15-minute AI Interview is confirmed.</p>
                <p className="mt-2">📅 <strong>{formatShortDate(interviewDate)}</strong></p>
                <p>🕐 {interviewTime} ({tzLabel})</p>
                <p className="mt-2">We&apos;re excited to connect with you and help you find the right opportunities.</p>
                <p className="mt-2 text-gray-500">– Team HireRight</p>
              </div>
              <button 
                onClick={() => {
                  const phone = displayPhone.replace(/[^0-9]/g, "");
                  const message = encodeURIComponent(`Hi ${displayName}! 👋\n\nYour 15-minute AI Interview is confirmed.\n\n📅 ${formatShortDate(interviewDate)}\n🕐 ${interviewTime} (${tzLabel})\n\nWe're excited to connect with you and help you find the right opportunities.\n\n– Team HireRight`);
                  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                }}
                className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Open WhatsApp
              </button>
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">We&apos;ll Remind You!</h3>
            <p className="text-sm text-gray-500 mb-6">You&apos;ll get reminders so you never miss your interview.</p>
            <div className="flex items-center justify-between">
              {[
                { 
                  time: "24 Hours Before", 
                  desc: "We'll send you a reminder via Email & WhatsApp.", 
                  icon: "📧",
                  sent: interview?.reminder24hSent || false,
                  field: "reminder24hSent"
                },
                { 
                  time: "1 Hour Before", 
                  desc: "Quick reminder with interview instructions.", 
                  icon: "⏰",
                  sent: interview?.reminder1hSent || false,
                  field: "reminder1hSent"
                },
                { 
                  time: "15 Minutes Before", 
                  desc: "Final reminder to help you get ready.", 
                  icon: "🔔",
                  sent: interview?.reminder15mSent || false,
                  field: "reminder15mSent"
                },
                { 
                  time: "Interview Time", 
                  desc: "Join and ace your AI interview!", 
                  icon: "🎯",
                  sent: interview?.reminderNowSent || false,
                  field: "reminderNowSent"
                },
              ].map((reminder, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      reminder.sent 
                        ? "bg-green-100" 
                        : "bg-indigo-100"
                    }`}>
                      {reminder.sent ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <span className="text-xl">{reminder.icon}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900">{reminder.time}</p>
                    <p className="text-[10px] text-gray-500 max-w-[100px]">{reminder.desc}</p>
                    {reminder.sent && (
                      <p className="text-[10px] text-green-600 font-medium mt-1">✓ Sent</p>
                    )}
                  </div>
                  {i < 3 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-8 h-8 text-yellow-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white">You&apos;ve Taken the Right Step!</h4>
              <p className="text-sm text-white/80 mt-1">Believe in yourself. Showcase your best. Opportunities are waiting for you!</p>
              <p className="text-sm text-white/80">We&apos;re with you, every step of the way.</p>
            </div>
          </div>
<p className="text-center text-xs text-gray-500 mt-4">
             If you need any help, reach out to us at <span className="text-indigo-600">care@hireright.com</span>
           </p>
        </div>
      </main>

      {/* Interview Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Interview Guide</h2>
                <p className="text-sm text-gray-500">Tips to help you succeed in your 15-minute interview</p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Technical Questions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💻</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Technical Questions</h3>
                </div>
                <ul className="space-y-2 ml-10">
                  {interviewGuide.technical.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Behavioral Questions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🤝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Behavioral Questions</h3>
                </div>
                <ul className="space-y-2 ml-10">
                  {interviewGuide.behavioral.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* General Tips */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">General Tips</h3>
                </div>
                <ul className="space-y-2 ml-10">
                  {interviewGuide.general.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interview Format */}
              <div className="bg-indigo-50 rounded-xl p-5">
                <h3 className="font-semibold text-indigo-900 mb-3">Interview Format</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-700">Duration: 15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-700">Mode: AI Video Interview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-700">5-6 questions total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-700">Fair & unbiased evaluation</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Got it, I&apos;m Ready!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
