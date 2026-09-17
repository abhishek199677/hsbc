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
          fetch("/api/interview"),
          fetch("/api/profile"),
        ]);
        const interviewData = await interviewRes.json();
        const profileData = await profileRes.json();
        if (cancelled) return;
        if (interviewData.success && interviewData.interview) {
          setInterview(interviewData.interview as InterviewData);
          if (interviewData.interview.id) {
            sessionStorage.setItem("tcInterviewId", interviewData.interview.id);
          }
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#09090b]">
      <Sidebar currentStep={currentStep} progress={progress} />
      <main className="flex-1 bg-[#09090b] overflow-auto">
        <div className="p-4 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#a1a1aa] font-mono uppercase tracking-wider">
            <Shield className="w-4 h-4 text-[#f5c542]" />
            Your data is safe with us
          </div>
            <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#e050b0]/10 flex items-center justify-center">
              <span className="text-sm font-medium text-[#a78bfa]">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-white font-mono">Hi, {displayName}</span>
          </div>
        </div>
        <StepIndicator steps={steps} currentStep={currentStep} />
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Success Banner */}
          <div className="bg-[#18181b] border border-[#4dacde]/30 p-6 mb-6 flex items-center gap-6">
            <div className="w-16 h-16 bg-[#4dacde]/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-[#f5c542]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white font-mono">All Set, {displayName}!</h3>
              <p className="text-lg font-semibold text-white font-mono">Your 15-Minute AI Interview is Confirmed!</p>
              <p className="text-sm text-[#a1a1aa] mt-1 font-mono">We&apos;re excited to connect with you and help you take the next step in your career journey.</p>
            </div>
            <div className="hidden lg:block w-24 h-24 bg-[#e050b0]/10 flex items-center justify-center">
              <span className="text-4xl">🤖</span>
            </div>
          </div>

          {/* Start Live Interview CTA */}
          <div className="bg-[#18181b] border border-[#27272a] p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#e050b0]/10 flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <div>
                <p className="font-semibold text-white font-mono">Ready when you are!</p>
                <p className="text-sm text-[#a1a1aa] font-mono">Start your 15-minute AI video interview now.</p>
              </div>
            </div>
            <Link
              href="/interview/room"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#e050b0] text-white text-sm font-medium hover:bg-[#e050b0]/80 transition-colors flex-shrink-0 font-mono uppercase tracking-wider"
            >
              Start Live Interview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interview Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#18181b] border border-[#27272a] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-mono uppercase tracking-wider">Your Interview Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#a78bfa] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#a1a1aa] font-mono uppercase tracking-wider">Date</p>
                    <p className="text-sm font-medium text-white font-mono">{formatDate(interviewDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#a78bfa] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#a1a1aa] font-mono uppercase tracking-wider">Time</p>
                    <p className="text-sm font-medium text-white font-mono">{interviewTime} ({tzLabel}) <span className="ml-2 px-2 py-0.5 bg-[#e050b0]/20 text-[#a78bfa] text-xs font-mono">15 Min Interview</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-[#a78bfa] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#a1a1aa] font-mono uppercase tracking-wider">Interview Mode</p>
                    <p className="text-sm font-medium text-white font-mono">AI Video Interview</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#a78bfa] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#a1a1aa] font-mono uppercase tracking-wider">Interview Type</p>
                    <p className="text-sm font-medium text-white font-mono">Technical + Behavioral Assessment</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={addToCalendar}
                className="w-full mt-6 py-3 border border-[#e050b0] text-[#a78bfa] text-sm font-medium hover:bg-[#e050b0]/10 transition-colors flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
              >
                <Calendar className="w-4 h-4" />
                Add to Calendar
              </button>
            </div>

            <div className="bg-[#18181b] border border-[#27272a] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-mono uppercase tracking-wider">What&apos;s Next?</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#f5c542] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#a1a1aa] font-mono">Our AI will conduct a fair and personalized conversation to understand you better.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#f5c542] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#a1a1aa] font-mono">Showcase your skills, experiences and problem-solving approach.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#f5c542] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#a1a1aa] font-mono">Get matched with opportunities that are the right fit for you.</span>
                </li>
              </ul>
              <button 
                onClick={() => setShowGuide(true)}
                className="w-full mt-6 py-3 bg-[#e050b0] text-white text-sm font-medium hover:bg-[#e050b0]/80 transition-colors flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
              >
                View Interview Guide
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confirmation Sent */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2 font-mono uppercase tracking-wider">We&apos;ve Sent You a Confirmation!</h3>
            <p className="text-sm text-[#a1a1aa] font-mono">Check your email and WhatsApp for all the details.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Email */}
            <div className="bg-[#18181b] border border-[#27272a] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#a78bfa]" />
                  <span className="font-medium text-white font-mono uppercase tracking-wider">Email</span>
                </div>
                {interview?.emailSent ? (
                  <span className="flex items-center gap-1 text-xs text-[#f5c542] font-mono"><CheckCircle className="w-3 h-3" /> Sent</span>
                ) : (
                  <span className="text-xs text-[#a1a1aa] font-mono">Not sent</span>
                )}
              </div>
              <div className="text-sm text-[#a1a1aa] mb-3 font-mono">
                <p>To: <span className="text-white">{displayEmail}</span></p>
                <p>Subject: <span className="text-white">Your AI Interview is Confirmed – {formatShortDate(interviewDate)}</span></p>
              </div>
              <div className="bg-[#1a1a1a] p-4 text-sm text-[#a1a1aa] font-mono">
                <p>Hi {displayName},</p>
                <p className="mt-2">Great news! Your 15-minute AI interview is confirmed.</p>
                <p className="mt-2">📅 Date: {formatDate(interviewDate)}</p>
                <p>🕐 Time: {interviewTime} ({tzLabel})</p>
                <p className="mt-2">We look forward to meeting you!</p>
                <p className="mt-2 text-[#a1a1aa]">– Team HireRight</p>
              </div>
              <button 
                onClick={() => {
                  const subject = encodeURIComponent(`Your AI Interview is Confirmed – ${formatShortDate(interviewDate)}`);
                  const body = encodeURIComponent(`Hi ${displayName},\n\nGreat news! Your 15-minute AI interview is confirmed.\n\n📅 Date: ${formatDate(interviewDate)}\n🕐 Time: ${interviewTime} (${tzLabel})\n\nWe look forward to meeting you!\n\n– Team HireRight`);
                  window.open(`mailto:${displayEmail}?subject=${subject}&body=${body}`, "_blank");
                }}
                className="w-full mt-4 py-2 border border-[#27272a] text-[#a1a1aa] text-sm font-medium hover:bg-[#1a1a1a] transition-colors font-mono uppercase tracking-wider"
              >
                Open Email
              </button>
            </div>

            {/* WhatsApp */}
            <div className="bg-[#18181b] border border-[#27272a] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#f5c542]" />
                  <span className="font-medium text-white font-mono uppercase tracking-wider">WhatsApp</span>
                </div>
                {interview?.whatsappSent ? (
                  <span className="flex items-center gap-1 text-xs text-[#f5c542] font-mono"><CheckCircle className="w-3 h-3" /> Sent</span>
                ) : (
                  <span className="text-xs text-[#a1a1aa] font-mono">Not sent</span>
                )}
              </div>
              <div className="text-sm text-[#a1a1aa] mb-3 font-mono">
                <p>To: <span className="text-white">{displayPhone}</span></p>
              </div>
              <div className="bg-[#4dacde]/10 p-4 text-sm text-[#a1a1aa] font-mono">
                <p>Hi {displayName}!</p>
                <p className="mt-2">Your 15-minute AI Interview is confirmed.</p>
                <p className="mt-2">📅 <strong className="text-white">{formatShortDate(interviewDate)}</strong></p>
                <p>🕐 {interviewTime} ({tzLabel})</p>
                <p className="mt-2">We&apos;re excited to connect with you and help you find the right opportunities.</p>
                <p className="mt-2 text-[#a1a1aa]">– Team HireRight</p>
              </div>
              <button 
                onClick={() => {
                  const phone = displayPhone.replace(/[^0-9]/g, "");
                  const message = encodeURIComponent(`Hi ${displayName}!\n\nYour 15-minute AI Interview is confirmed.\n\n📅 ${formatShortDate(interviewDate)}\n🕐 ${interviewTime} (${tzLabel})\n\nWe're excited to connect with you and help you find the right opportunities.\n\n– Team HireRight`);
                  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                }}
                className="w-full mt-4 py-2 bg-[#4dacde] text-black text-sm font-medium hover:bg-[#4dacde]/80 transition-colors font-mono uppercase tracking-wider"
              >
                Open WhatsApp
              </button>
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-[#18181b] border border-[#27272a] p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2 font-mono uppercase tracking-wider">We&apos;ll Remind You!</h3>
            <p className="text-sm text-[#a1a1aa] mb-6 font-mono">You&apos;ll get reminders so you never miss your interview.</p>
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
                    <div className={`w-12 h-12 flex items-center justify-center mx-auto mb-2 ${
                      reminder.sent 
                        ? "bg-[#4dacde]/20" 
                        : "bg-[#e050b0]/20"
                    }`}>
                      {reminder.sent ? (
                        <CheckCircle className="w-6 h-6 text-[#f5c542]" />
                      ) : (
                        <span className="text-xl">{reminder.icon}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-white font-mono">{reminder.time}</p>
                    <p className="text-[10px] text-[#a1a1aa] max-w-[100px] font-mono">{reminder.desc}</p>
                    {reminder.sent && (
                      <p className="text-[10px] text-[#f5c542] font-medium mt-1 font-mono">✓ Sent</p>
                    )}
                  </div>
                  {i < 3 && <ChevronRight className="w-4 h-4 text-[#2a2a2a]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-[#e050b0] p-6 flex items-center gap-6">
            <div className="w-16 h-16 bg-[#09090b]/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-8 h-8 text-[#a78bfa]" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white font-mono uppercase tracking-wider">You&apos;ve Taken the Right Step!</h4>
              <p className="text-sm text-white/80 mt-1 font-mono">Believe in yourself. Showcase your best. Opportunities are waiting for you!</p>
              <p className="text-sm text-white/80 font-mono">We&apos;re with you, every step of the way.</p>
            </div>
          </div>
<p className="text-center text-xs text-[#a1a1aa] mt-4 font-mono">
             If you need any help, reach out to us at <span className="text-[#a78bfa]">care@hireright.com</span>
           </p>
        </div>
      </main>

      {/* Interview Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]/80 p-4">
          <div className="bg-[#18181b] border border-[#27272a] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider">AI Interview Guide</h2>
                <p className="text-sm text-[#a1a1aa] font-mono">Tips to help you succeed in your 15-minute interview</p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-10 h-10 hover:bg-[#1a1a1a] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#a1a1aa]" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Technical Questions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-[#e050b0]/10 flex items-center justify-center">
                    <span className="text-lg">💻</span>
                  </div>
                  <h3 className="font-semibold text-white font-mono uppercase tracking-wider">Technical Questions</h3>
                </div>
                <ul className="space-y-2 ml-10">
                  {interviewGuide.technical.map((tip, i) => (
                    <li key={i} className="text-sm text-[#a1a1aa] flex items-start gap-2 font-mono">
                      <CheckCircle className="w-4 h-4 text-[#f5c542] mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Behavioral Questions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-[#e050b0]/10 flex items-center justify-center">
                    <span className="text-lg">🤝</span>
                  </div>
                  <h3 className="font-semibold text-white font-mono uppercase tracking-wider">Behavioral Questions</h3>
                </div>
                <ul className="space-y-2 ml-10">
                  {interviewGuide.behavioral.map((tip, i) => (
                    <li key={i} className="text-sm text-[#a1a1aa] flex items-start gap-2 font-mono">
                      <CheckCircle className="w-4 h-4 text-[#f5c542] mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* General Tips */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-[#4dacde]/10 flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                  <h3 className="font-semibold text-white font-mono uppercase tracking-wider">General Tips</h3>
                </div>
                <ul className="space-y-2 ml-10">
                  {interviewGuide.general.map((tip, i) => (
                    <li key={i} className="text-sm text-[#a1a1aa] flex items-start gap-2 font-mono">
                      <CheckCircle className="w-4 h-4 text-[#f5c542] mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interview Format */}
              <div className="bg-[#e050b0]/10 p-5">
                <h3 className="font-semibold text-[#a78bfa] mb-3 font-mono uppercase tracking-wider">Interview Format</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#a78bfa]" />
                    <span className="text-[#a1a1aa] font-mono">Duration: 15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#a78bfa]" />
                    <span className="text-[#a1a1aa] font-mono">Mode: AI Video Interview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#a78bfa]" />
                    <span className="text-[#a1a1aa] font-mono">5-6 questions total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#a78bfa]" />
                    <span className="text-[#a1a1aa] font-mono">Fair & unbiased evaluation</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#18181b] border-t border-[#27272a] px-6 py-4">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-[#e050b0] text-white font-medium hover:bg-[#e050b0]/80 transition-colors font-mono uppercase tracking-wider"
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
