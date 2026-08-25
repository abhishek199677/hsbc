import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true, organizationId: true },
    });

    if (!requester || (requester.role !== "admin" && requester.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: "jobseeker",
        organizationId: requester.organizationId,
      },
      include: {
        profile: true,
        interview: {
          select: {
            status: true,
            evaluationScore: true,
            date: true,
            time: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const jobSeekers = users.map((u, index) => ({
      id: u.id,
      sl: index + 1,
      name: u.name || "N/A",
      email: u.email,
      phone: u.phone || "N/A",
      skills: u.profile?.skills
        ? (() => {
            try {
              const parsed = JSON.parse(u.profile.skills);
              return Array.isArray(parsed) ? parsed : typeof parsed === "string" ? [parsed] : [];
            } catch {
              return u.profile.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
            }
          })()
        : [],
      citizenship: u.profile?.currentLocation || "N/A",
      experience: u.profile?.totalExperience || "N/A",
      registrationDate: u.createdAt.toISOString(),
      interviewStatus: u.interview?.status || null,
      score: u.interview?.evaluationScore || null,
      profileComplete: u.profile?.isComplete || false,
    }));

    return NextResponse.json({ success: true, jobSeekers, total: jobSeekers.length });
  } catch (error) {
    console.error("Failed to fetch job seekers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
