import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
