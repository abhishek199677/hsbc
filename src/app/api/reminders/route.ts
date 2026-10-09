import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateReminderEmail } from "@/lib/email";
import { sendWhatsAppMessage, generateReminderWhatsApp } from "@/lib/whatsapp";
import { to24HourTime, formatTimeLabel } from "@/lib/time";

// Helper to parse interview date/time into a Date object
function getInterviewDateTime(date: string, time: string): Date {
  // Parse date string (e.g., "2025-05-19" or "Monday, 19 May 2025")
  let interviewDate: Date;
  
  if (date.includes(",")) {
    // Format: "Monday, 19 May 2025"
    const parts = date.split(", ")[1].split(" ");
    const day = parseInt(parts[0]);
    const monthMap: Record<string, number> = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };
    const month = monthMap[parts[1]];
    const year = parseInt(parts[2]);
    interviewDate = new Date(year, month, day);
  } else {
    // Format: "2025-05-19"
    interviewDate = new Date(date);
  }

  // Parse time — accepts both "13:30" (stored form) and legacy "01:30 PM"
  const time24 = to24HourTime(time);
  if (time24) {
    const [hours, minutes] = time24.split(":").map(Number);
    interviewDate.setHours(hours, minutes, 0, 0);
  }

  return interviewDate;
}

// GET - Check and send reminders for upcoming interviews
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization");
    if (!cronSecret) {
      return NextResponse.json({ error: "Reminder worker is not configured" }, { status: 503 });
    }
    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    let sent = 0;

    // Find all scheduled interviews
    const interviews = await prisma.interview.findMany({
      where: { status: "scheduled" },
      include: { user: { select: { id: true, email: true, name: true, phone: true } } },
    });

    for (const interview of interviews) {
      const interviewDateTime = getInterviewDateTime(interview.date, interview.time);
      const diffMs = interviewDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffMinutes = diffMs / (1000 * 60);
      const timezone = interview.timezone || "Asia/Kolkata";

      // 24 hours before reminder
      if (diffHours <= 24 && diffHours > 1 && !interview.reminder24hSent) {
        try {
          // Send email reminder
          await sendEmail({
            to: interview.user.email,
            subject: `Interview Reminder - Tomorrow at ${formatTimeLabel(interview.time)}`,
            html: generateReminderEmail({
              name: interview.user.name || "there",
              type: "24 Hours",
              date: interview.date,
              time: interview.time,
              message: "Your AI interview is tomorrow. Make sure you're prepared!",
              timezone,
            }),
          });

          // Send WhatsApp reminder
          if (interview.user.phone) {
            await sendWhatsAppMessage({
              to: interview.user.phone,
              message: generateReminderWhatsApp({
                name: interview.user.name || "there",
                type: "24 Hours",
                date: interview.date,
                time: interview.time,
                timezone,
              }),
            });
          }

          await prisma.interview.update({
            where: { id: interview.id },
            data: { reminder24hSent: true },
          });

          sent++;
        } catch (error) {
          console.error(`Failed to send 24h reminder to ${interview.user.email}:`, error);
        }
      }

      // 1 hour before reminder
      if (diffHours <= 1 && diffMinutes > 15 && !interview.reminder1hSent) {
        try {
          // Send email reminder
          await sendEmail({
            to: interview.user.email,
            subject: `Interview Starting in 1 Hour`,
            html: generateReminderEmail({
              name: interview.user.name || "there",
              type: "1 Hour",
              date: interview.date,
              time: interview.time,
              message: "Your AI interview starts in 1 hour. Final preparations time!",
              timezone,
            }),
          });

          // Send WhatsApp reminder
          if (interview.user.phone) {
            await sendWhatsAppMessage({
              to: interview.user.phone,
              message: generateReminderWhatsApp({
                name: interview.user.name || "there",
                type: "1 Hour",
                date: interview.date,
                time: interview.time,
                timezone,
              }),
            });
          }

          await prisma.interview.update({
            where: { id: interview.id },
            data: { reminder1hSent: true },
          });

          sent++;
        } catch (error) {
          console.error(`Failed to send 1h reminder to ${interview.user.email}:`, error);
        }
      }

      // 15 minutes before reminder
      if (diffMinutes <= 15 && diffMinutes > 0 && !interview.reminder15mSent) {
        try {
          // Send email reminder
          await sendEmail({
            to: interview.user.email,
            subject: `Interview Starting in 15 Minutes!`,
            html: generateReminderEmail({
              name: interview.user.name || "there",
              type: "15 Minutes",
              date: interview.date,
              time: interview.time,
              message: "Your AI interview starts in 15 minutes. Get ready to join!",
              timezone,
            }),
          });

          // Send WhatsApp reminder
          if (interview.user.phone) {
            await sendWhatsAppMessage({
              to: interview.user.phone,
              message: generateReminderWhatsApp({
                name: interview.user.name || "there",
                type: "15 Minutes",
                date: interview.date,
                time: interview.time,
                timezone,
              }),
            });
          }

          await prisma.interview.update({
            where: { id: interview.id },
            data: { reminder15mSent: true },
          });

          sent++;
        } catch (error) {
          console.error(`Failed to send 15m reminder to ${interview.user.email}:`, error);
        }
      }

      // Interview time reminder (now)
      if (diffMinutes <= 0 && diffMinutes > -15 && !interview.reminderNowSent) {
        try {
          // Send email reminder
          await sendEmail({
            to: interview.user.email,
            subject: `Your AI Interview is Starting Now!`,
            html: generateReminderEmail({
              name: interview.user.name || "there",
              type: "Now",
              date: interview.date,
              time: interview.time,
              message: "Your AI interview is starting now! Click the link below to join.",
              timezone,
            }),
          });

          // Send WhatsApp reminder
          if (interview.user.phone) {
            await sendWhatsAppMessage({
              to: interview.user.phone,
              message: generateReminderWhatsApp({
                name: interview.user.name || "there",
                type: "Now",
                date: interview.date,
                time: interview.time,
                timezone,
              }),
            });
          }

          await prisma.interview.update({
            where: { id: interview.id },
            data: { reminderNowSent: true },
          });

          sent++;
        } catch (error) {
          console.error(`Failed to send now reminder to ${interview.user.email}:`, error);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent,
      checked: interviews.length 
    });
  } catch (error) {
    console.error("Reminder check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
