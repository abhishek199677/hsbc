import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        emailVerifiedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            plan: true,
            planStatus: true,
            trialEndsAt: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        emailVerified: !!userData.emailVerifiedAt,
      },
      organization: userData.organization,
    });
  } catch (error) {
    console.error("Account info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
