import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = getUserFromRequest(request);
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
      where: { organizationId: requester.organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        profile: {
          select: {
            isComplete: true,
            currentRole: true,
            totalExperience: true,
            currentLocation: true,
            skills: true,
          },
        },
        interview: {
          select: {
            date: true,
            time: true,
            status: true,
            mode: true,
            videoUrl: true,
            captionUrl: true,
            evaluationScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
