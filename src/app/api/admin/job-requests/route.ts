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

    const jobs = await prisma.jobRequisition.findMany({
      where: {
        organizationId: requester.organizationId,
      },
      include: {
        client: {
          select: { name: true },
        },
        _count: {
          select: { candidates: true, placements: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const jobRequests = jobs.map((j, index) => ({
      id: j.id,
      sl: index + 1,
      jrId: `JR-${j.id.slice(0, 8).toUpperCase()}`,
      clientName: j.client?.name || "N/A",
      title: j.title,
      description: j.description,
      requirements: j.requirements,
      location: j.location || "N/A",
      experienceMin: j.experienceMin,
      experienceMax: j.experienceMax,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      jobType: j.jobType || "Full-time",
      status: j.status,
      priority: j.priority,
      openings: j.openings,
      filledCount: j.filledCount,
      deadline: j.deadline?.toISOString() || null,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
      applicants: j._count.candidates,
      placements: j._count.placements,
    }));

    return NextResponse.json({ success: true, jobRequests, total: jobRequests.length });
  } catch (error) {
    console.error("Failed to fetch job requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
