"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StepIndicator from "@/components/StepIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { timezoneLabel } from "@/lib/timezone";
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Lock, ArrowLeft, ArrowRight, Shield, Calendar, Video, Info } from "lucide-react";

const steps = [
  { number: 1, label: "Profile", sublabel: "Tell us who you are" },
  { number: 2, label: "Resume", sublabel: "Your expertise" },
  { number: 3, label: "About You", sublabel: "What you're looking for" },
  { number: 4, label: "Availability", sublabel: "Let's get you ready" },
  { number: 5, label: "AI Interview", sublabel: "Let's get you ready" },
  { number: 6, label: "All Set!", sublabel: "You're all set!" },
];

const timeSlots = {
  morning: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
  afternoon: ["12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"],
  evening: ["04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"],
};

export default function InterviewSchedulePage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(4);
  const [selectedTime, setSelectedTime] = useState("01:30 PM");
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!cancelled && data.success && data.profile?.timezone) {
          setTimezone(data.profile.timezone);
        }
      } catch {
        // keep default
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const tzLabel = timezoneLabel(timezone);

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [currentMonth, setCurrentMonth] = useState(() =>
    new Date(today.getFullYear(), today.getMonth() + (today.getDate() > 25 ? 1 : 0), 1)
  );

  const isWeekend = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
    return d === 0 || d === 6;
  };

  const isPastDay = (day: number) =>
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < todayMidnight;

  const [selectedDate, setSelectedDate] = useState<number | null>(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    for (let d = 1; d <= 28; d++) {
      const date = new Date(y, m, d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      if (date >= todayMidnight) return d;
    }
    return null;
  });

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(next);
    if (selectedDate === null) return;
    const selected = new Date(next.getFullYear(), next.getMonth(), selectedDate);
    if (selected.getDay() === 0 || selected.getDay() === 6 || selected < todayMidnight) {
      for (let day = 1; day <= 28; day++) {
        const cand = new Date(next.getFullYear(), next.getMonth(), day);
        if (cand.getDay() !== 0 && cand.getDay() !== 6 && cand >= todayMidnight) {
          setSelectedDate(day);
          break;
        }
      }
    }
  };

  const progress = Math.round((currentStep / steps.length) * 100);
  const displayName = user?.name || "User";

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const limitedDays = [8, 9, 15, 16, 22, 23, 29, 30];

  const selectedDateLabel =
    selectedDate !== null
      ? currentMonth.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : "Select a date";

  const selectedDateShort =
    selectedDate !== null
      ? currentMonth.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
      : "Select a date";

  const saveInterview = async () => {
    if (!token || selectedDate === null) return false;
    setSaving(true);
    try {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: dateStr,
          time: selectedTime,
        }),
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Failed to save interview:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    const saved = await saveInterview();
    if (saved) {
      router.push("/confirmation");
    }
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
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium">Hi, {displayName} 👋</span>
          </div>
        </div>
        <StepIndicator steps={steps} currentStep={currentStep} />
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Great! Your resume is uploaded successfully! 🎉</h3>
              <p className="text-sm text-gray-600">Let&apos;s book your 15-minute AI interview. Choose a time that works best for you.</p>
            </div>
          </div>

          {/* AI Interview Info */}
          <div className="bg-primary/10 rounded-xl p-6 mb-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">✨</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Just 15 minutes to open doors to endless opportunities.</p>
              <p className="text-xs text-primary-dark mt-1">Our AI interview is designed to understand you better and match you with roles where you can shine.</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <Clock className="w-6 h-6 text-primary mx-auto" />
                <p className="text-[10px] text-gray-600 mt-1">15 Min<br/>Interview</p>
              </div>
              <div className="text-center">
                <span className="text-2xl">🧠</span>
                <p className="text-[10px] text-gray-600 mt-1">AI-Powered<br/>Assessment</p>
              </div>
              <div className="text-center">
                <Lock className="w-6 h-6 text-primary mx-auto" />
                <p className="text-[10px] text-gray-600 mt-1">Secure &<br/>Private</p>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">4. Select Your 15-Minute Interview Slot</h3>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Interview duration: 15 minutes
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6">All times are shown in <span className="font-medium text-primary">{tzLabel} ({timezone})</span></p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{monthName}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => changeMonth(1)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isAvailable = !isWeekend(day) && !isPastDay(day);
                    const isLimited = isAvailable && limitedDays.includes(day);
                    const isSelected = day === selectedDate;

                    return (
                      <button
                        key={day}
                        onClick={() => isAvailable && setSelectedDate(day)}
                        disabled={!isAvailable}
                        className={`relative w-full aspect-square rounded-lg flex items-center justify-center text-sm transition-colors ${
                          isSelected
                            ? "bg-primary text-white"
                            : isAvailable
                            ? "hover:bg-gray-100 text-gray-900"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        {day}
                        {isAvailable && !isSelected && (
                          <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isLimited ? "bg-yellow-500" : "bg-green-500"}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> Available</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> Limited Slots</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full" /> Unavailable</span>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">{selectedDateLabel} ☀️</h4>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Morning</p>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.morning.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`time-slot ${selectedTime === time ? "selected" : ""}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Afternoon</p>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.afternoon.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`time-slot ${selectedTime === time ? "selected" : ""}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Evening</p>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.evening.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`time-slot ${selectedTime === time ? "selected" : ""}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Time Confirmation */}
          <div className="bg-white rounded-xl border p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">You&apos;ve selected</p>
                <p className="text-sm text-gray-600">{selectedDateShort}</p>
                <p className="text-sm text-gray-600">{selectedTime} ({tzLabel})</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> You will receive a reminder before your interview</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Reschedule or change time anytime</span>
              <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Smooth, secure and distraction-free experience</span>
            </div>
          </div>

          {/* All Set Banner */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 flex items-center gap-4">
            <span className="text-4xl">🎉</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">All Set! You&apos;re Good to Go!</h4>
              <p className="text-sm text-gray-600">We&apos;re looking forward to your interview. Get ready to showcase your <strong>best</strong> self.</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 px-6 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex gap-3">
              <Link
                href="/interview/room"
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Video className="w-4 h-4" />
                Start Live Interview
              </Link>
              <button
                onClick={handleConfirm}
                disabled={saving || selectedDate === null}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm & Continue"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Your information is encrypted and secure
          </p>
        </div>
      </main>
    </div>
  );
}
