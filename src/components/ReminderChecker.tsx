"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ReminderChecker() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const checkReminders = async () => {
      try {
        const response = await fetch("/api/reminders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success && data.results?.length > 0) {
          console.log("Reminders sent:", data.results);
        }
      } catch (error) {
        // Silently fail - reminders are non-critical
        console.error("Reminder check failed:", error);
      }
    };

    // Check reminders immediately, then every minute
    checkReminders();
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [token]);

  // This component doesn't render anything
  return null;
}
