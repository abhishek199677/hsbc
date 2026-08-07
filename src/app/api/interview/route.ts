import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { sendEmail, generateInterviewConfirmationEmail } from "@/lib/email";
import { sendWhatsAppMessage, generateInterviewConfirmationWhatsApp } from "@/lib/whatsapp";
import { getPlanLimits, isPlanActive } from "@/lib/plan";

// GET - Fetch interview
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interview = await prisma.interview.findUnique({
      where: { userId: user.userId },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, interview });
  } catch (error) {
    console.error("Get interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Schedule interview
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
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

    const interviewsThisMonth = await prisma.interview.count({
      where: { userId: user.userId, createdAt: { gte: monthStart } },
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
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoUrl, captionUrl, evaluation, evaluationScore, transcript, status, proctoringReport, proctoringFlags, proctoringStatus } = body;

    const existingInterview = await prisma.interview.findUnique({
      where: { userId: user.userId },
    });

    if (!existingInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const interview = await prisma.interview.update({
      where: { id: existingInterview.id },
      data: {
        videoUrl: videoUrl ?? existingInterview.videoUrl,
        captionUrl: captionUrl ?? existingInterview.captionUrl,
        evaluation: evaluation ?? existingInterview.evaluation,
        evaluationScore: evaluationScore ?? existingInterview.evaluationScore,
        transcript: transcript ?? existingInterview.transcript,
        status: status ?? "completed",
        proctoringReport:
          typeof proctoringReport === "string" || proctoringReport === null
            ? proctoringReport
            : proctoringReport !== undefined
              ? JSON.stringify(proctoringReport)
              : existingInterview.proctoringReport,
        proctoringFlags:
          typeof proctoringFlags === "number"
            ? proctoringFlags
            : existingInterview.proctoringFlags,
        proctoringStatus:
          typeof proctoringStatus === "string"
            ? proctoringStatus
            : existingInterview.proctoringStatus,
      },
    });

    return NextResponse.json({ success: true, interview });
  } catch (error) {
    console.error("Complete interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
