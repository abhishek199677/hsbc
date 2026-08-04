"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ReminderChecker() {
  const { token } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;

    // Check reminders immediately
    checkReminders();

    // Then check every minute
    intervalRef.current = setInterval(() => {
      checkReminders();
    }, 60000); // 60 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token]);

  const checkReminders = async () => {
    try {
      const response = await fetch("/api/reminders");
      const data = await response.json();
      if (data.success && data.results?.length > 0) {
        console.log("Reminders sent:", data.results);
      }
    } catch (error) {
      // Silently fail - reminders are non-critical
      console.error("Reminder check failed:", error);
    }
  };

  // This component doesn't render anything
  return null;
}
