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
      linkedinUrl,
      workExperience,
      projects,
      keyAchievements,
      certifications,
      languages,
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

    // Fetch current profile to avoid overwriting non-empty fields with empty strings
    const currentProfile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    // Only update a field if the new value is non-empty OR the field is explicitly being cleared
    // (i.e., new value differs from current and new value is not just an empty string from formData defaults)
    const safeUpdate = (fieldName: string, newValue: unknown, currentValue: unknown) => {
      if (newValue === undefined) return undefined; // Don't touch unchanged fields
      if (typeof newValue === "string" && newValue.trim() === "" && currentValue && String(currentValue).trim() !== "") {
        return undefined; // Don't overwrite non-empty DB value with empty string
      }
      return newValue;
    };

    const profile = await prisma.profile.upsert({
      where: { userId: user.userId },
      update: {
        ...(step !== undefined && { step }),
        ...(aboutYou !== undefined && { aboutYou: safeUpdate("aboutYou", aboutYou, currentProfile?.aboutYou) }),
        ...(whatDrivesYou !== undefined && { whatDrivesYou: safeUpdate("whatDrivesYou", whatDrivesYou, currentProfile?.whatDrivesYou) }),
        ...(strengths !== undefined && { strengths: safeUpdate("strengths", strengths, currentProfile?.strengths) }),
        ...(currentRole !== undefined && { currentRole: safeUpdate("currentRole", currentRole, currentProfile?.currentRole) }),
        ...(totalExperience !== undefined && { totalExperience: safeUpdate("totalExperience", totalExperience, currentProfile?.totalExperience) }),
        ...(currentLocation !== undefined && { currentLocation: safeUpdate("currentLocation", currentLocation, currentProfile?.currentLocation) }),
        ...(noticePeriod !== undefined && { noticePeriod: safeUpdate("noticePeriod", noticePeriod, currentProfile?.noticePeriod) }),
        ...(skills !== undefined && { skills: safeUpdate("skills", skills, currentProfile?.skills) }),
        ...(currentCompany !== undefined && { currentCompany: safeUpdate("currentCompany", currentCompany, currentProfile?.currentCompany) }),
        ...(education !== undefined && { education: safeUpdate("education", education, currentProfile?.education) }),
        ...(linkedinUrl !== undefined && { linkedinUrl: safeUpdate("linkedinUrl", linkedinUrl, currentProfile?.linkedinUrl) }),
        ...(workExperience !== undefined && { workExperience: safeUpdate("workExperience", workExperience, currentProfile?.workExperience) }),
        ...(projects !== undefined && { projects: safeUpdate("projects", projects, currentProfile?.projects) }),
        ...(keyAchievements !== undefined && { keyAchievements: safeUpdate("keyAchievements", keyAchievements, currentProfile?.keyAchievements) }),
        ...(certifications !== undefined && { certifications: safeUpdate("certifications", certifications, currentProfile?.certifications) }),
        ...(languages !== undefined && { languages: safeUpdate("languages", languages, currentProfile?.languages) }),
        ...(jobType !== undefined && { jobType: safeUpdate("jobType", jobType, currentProfile?.jobType) }),
        ...(salaryRange !== undefined && { salaryRange: safeUpdate("salaryRange", salaryRange, currentProfile?.salaryRange) }),
        ...(preferredLocation !== undefined && { preferredLocation: safeUpdate("preferredLocation", preferredLocation, currentProfile?.preferredLocation) }),
        ...(workMode !== undefined && { workMode: safeUpdate("workMode", workMode, currentProfile?.workMode) }),
        ...(preferredDate !== undefined && { preferredDate: safeUpdate("preferredDate", preferredDate, currentProfile?.preferredDate) }),
        ...(preferredTimeSlot !== undefined && { preferredTimeSlot: safeUpdate("preferredTimeSlot", preferredTimeSlot, currentProfile?.preferredTimeSlot) }),
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
        linkedinUrl,
        workExperience,
        projects,
        keyAchievements,
        certifications,
        languages,
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
