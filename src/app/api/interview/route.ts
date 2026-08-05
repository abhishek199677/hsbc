import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { sendEmail, generateInterviewConfirmationEmail } from "@/lib/email";
import { sendWhatsAppMessage, generateInterviewConfirmationWhatsApp } from "@/lib/whatsapp";

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
export async function POST(request: Request) {  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, time, mode, type, duration } = body;

    if (!date || !time) {
      return NextResponse.json(
        { error: "Date and time are required" },
        { status: 400 }
      );
    }

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
          mode: mode || "AI Video Interview",
          type: type || "Technical + Behavioral Assessment",
          duration: duration || 15,
        },
      });
    }

    // Get user details for email and WhatsApp
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
    });

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
    const { videoUrl, captionUrl, evaluation, evaluationScore, transcript, status } = body;

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
      },
    });

    return NextResponse.json({ success: true, interview });
  } catch (error) {
    console.error("Complete interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
