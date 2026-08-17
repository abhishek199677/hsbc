import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// GET - Fetch profile
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
      include: { user: { select: { id: true, email: true, name: true, phone: true } } },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update profile
export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      step,
      aboutYou,
      whatDrivesYou,
      strengths,
      currentRole,
      totalExperience,
      currentLocation,
      noticePeriod,
      skills,
      currentCompany,
      education,
      jobType,
      salaryRange,
      preferredLocation,
      workMode,
      preferredDate,
      preferredTimeSlot,
      timezone,
      resumeUrl,
      resumeFileName,
    } = body;

    const profile = await prisma.profile.upsert({
      where: { userId: user.userId },
      update: {
        ...(step !== undefined && { step }),
        ...(aboutYou !== undefined && { aboutYou }),
        ...(whatDrivesYou !== undefined && { whatDrivesYou }),
        ...(strengths !== undefined && { strengths }),
        ...(currentRole !== undefined && { currentRole }),
        ...(totalExperience !== undefined && { totalExperience }),
        ...(currentLocation !== undefined && { currentLocation }),
        ...(noticePeriod !== undefined && { noticePeriod }),
        ...(skills !== undefined && { skills }),
        ...(currentCompany !== undefined && { currentCompany }),
        ...(education !== undefined && { education }),
        ...(jobType !== undefined && { jobType }),
        ...(salaryRange !== undefined && { salaryRange }),
        ...(preferredLocation !== undefined && { preferredLocation }),
        ...(workMode !== undefined && { workMode }),
        ...(preferredDate !== undefined && { preferredDate }),
        ...(preferredTimeSlot !== undefined && { preferredTimeSlot }),
        ...(timezone !== undefined && { timezone }),
        ...(resumeUrl !== undefined && { resumeUrl }),
        ...(resumeFileName !== undefined && { resumeFileName }),
      },
      create: {
        userId: user.userId,
        step: step || 1,
        aboutYou,
        whatDrivesYou,
        strengths,
        currentRole,
        totalExperience,
        currentLocation,
        noticePeriod,
        skills,
        currentCompany,
        education,
        jobType,
        salaryRange,
        preferredLocation,
        workMode,
        preferredDate,
        preferredTimeSlot,
        timezone,
        resumeUrl,
        resumeFileName,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
