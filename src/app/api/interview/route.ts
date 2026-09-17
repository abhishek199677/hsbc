import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { sendEmail, generateInterviewConfirmationEmail } from "@/lib/email";
import { sendWhatsAppMessage, generateInterviewConfirmationWhatsApp } from "@/lib/whatsapp";
import { getPlanLimits, isPlanActive } from "@/lib/plan";

// GET - Fetch interview
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interview = await prisma.interview.findUnique({
      where: { userId: user.userId },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // For job seekers: hide evaluation details unless results are unlocked
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });
    const isJobSeeker = userData?.role === "jobseeker";
    const responseInterview = isJobSeeker && !interview.resultsUnlocked
      ? {
          ...interview,
          evaluation: null,
          evaluationScore: null,
          resultsLocked: true,
        }
      : { ...interview, resultsLocked: false };

    return NextResponse.json({ success: true, interview: responseInterview });
  } catch (error) {
    console.error("Get interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Schedule interview
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { organization: true },
    });

    const orgPlan = userData?.organization?.plan || "starter";
    const planStatus = userData?.organization?.planStatus || null;

    // Enforce plan limits: block new interviews once the monthly quota is used
    // or when a paid subscription is no longer active.
    if (!isPlanActive(orgPlan, planStatus)) {
      return NextResponse.json(
        {
          error: "Your subscription is inactive. Please update your payment method.",
          plan: "starter",
          billingRequired: true,
        },
        { status: 402 }
      );
    }

    const limits = getPlanLimits(orgPlan);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Count interviews per organization (not per user) to enforce org-level limits
    const interviewsThisMonth = await prisma.interview.count({
      where: {
        user: { organizationId: user.organizationId },
        createdAt: { gte: monthStart },
      },
    });

    if (interviewsThisMonth >= limits.interviewsPerMonth) {
      return NextResponse.json(
        {
          error: `You have reached your monthly limit of ${limits.interviewsPerMonth} interviews on the ${orgPlan} plan. Upgrade to continue.`,
          plan: orgPlan,
          upgradeRequired: true,
        },
        { status: 402 }
      );
    }

    const body = await request.json();
    const { date, time, mode, type, duration } = body;

    if (!date || !time) {
      return NextResponse.json(
        { error: "Date and time are required" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof date !== "string" || !dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM, 24h)
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (typeof time !== "string" || !timeRegex.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM (24-hour)" },
        { status: 400 }
      );
    }

    // Reject past dates
    const interviewDate = new Date(`${date}T${time}:00`);
    if (interviewDate <= new Date()) {
      return NextResponse.json(
        { error: "Cannot schedule interviews in the past" },
        { status: 400 }
      );
    }

    // Reject weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = interviewDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        { error: "Interviews cannot be scheduled on weekends" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
      select: { timezone: true },
    });
    const timezone = profile?.timezone || "Asia/Kolkata";

    // Check if interview already exists
    const existingInterview = await prisma.interview.findUnique({
      where: { userId: user.userId },
    });

    let interview;

    if (existingInterview) {
      // Update existing interview
      interview = await prisma.interview.update({
        where: { userId: user.userId },
        data: {
          date,
          time,
          timezone: timezone || "Asia/Kolkata",
          mode: mode || "AI Video Interview",
          type: type || "Technical + Behavioral Assessment",
          duration: duration || 15,
          status: "scheduled",
        },
      });
    } else {
      // Create new interview
      interview = await prisma.interview.create({
        data: {
          userId: user.userId,
          date,
          time,
          timezone: timezone || "Asia/Kolkata",
          mode: mode || "AI Video Interview",
          type: type || "Technical + Behavioral Assessment",
          duration: duration || 15,
        },
      });
    }

    // Send confirmation email
    if (userData?.email) {
      const emailResult = await sendEmail({
        to: userData.email,
        subject: `Your AI Interview is Confirmed – ${date}`,
        html: generateInterviewConfirmationEmail({
          name: userData.name || "there",
          date,
          time,
          mode: mode || "AI Video Interview",
          timezone,
        }),
      });

      // Update email sent status
      if (emailResult.success) {
        await prisma.interview.update({
          where: { id: interview.id },
          data: { emailSent: true },
        });
      }
    }

    // Send confirmation WhatsApp
    if (userData?.phone) {
      const whatsappMessage = generateInterviewConfirmationWhatsApp({
        name: userData.name || "there",
        date,
        time,
        timezone,
      });
      
      const whatsappResult = await sendWhatsAppMessage({
        to: userData.phone,
        message: whatsappMessage,
      });

      // Update WhatsApp sent status
      if (whatsappResult) {
        await prisma.interview.update({
          where: { id: interview.id },
          data: { whatsappSent: true },
        });
      }
    }

    return NextResponse.json({ success: true, interview });
  } catch (error) {
    console.error("Schedule interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Complete interview (save video recording & evaluation)
export async function PATCH(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoUrl, captionUrl } = body;

    const existingInterview = await prisma.interview.findUnique({
      where: { userId: user.userId },
    });

    if (!existingInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const orgPrefix = `/api/files/org-${user.organizationId}/interviews/`;
    if (videoUrl !== undefined && (typeof videoUrl !== "string" || !videoUrl.startsWith(orgPrefix))) {
      return NextResponse.json({ error: "Invalid video URL" }, { status: 400 });
    }
    if (captionUrl !== undefined && (typeof captionUrl !== "string" || !captionUrl.startsWith(orgPrefix))) {
      return NextResponse.json({ error: "Invalid caption URL" }, { status: 400 });
    }

    const interview = await prisma.interview.update({
      where: { id: existingInterview.id },
      data: {
        videoUrl: videoUrl ?? existingInterview.videoUrl,
        captionUrl: captionUrl ?? existingInterview.captionUrl,
      },
    });

    return NextResponse.json({ success: true, interview });
  } catch (error) {
    console.error("Complete interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
