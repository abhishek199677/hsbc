import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, name } = body;

    if (!token) {
      return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { inviteToken: token },
      include: {
        user: {
          select: { id: true, email: true, name: true, organizationId: true },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
    }

    if (teamMember.acceptedAt) {
      return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 400 });
    }

    // Update user's name and password if provided
    const updateData: Record<string, unknown> = {
      acceptedAt: new Date(),
      inviteToken: null,
    };

    if (name) {
      await prisma.user.update({
        where: { id: teamMember.userId },
        data: { name },
      });
    }

    if (password) {
      const { hashPassword } = await import("@/lib/auth");
      const hashed = await hashPassword(password);
      await prisma.user.update({
        where: { id: teamMember.userId },
        data: { password: hashed },
      });
    }

    const updated = await prisma.teamMember.update({
      where: { id: teamMember.id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({
      success: true,
      teamMember: updated,
      organization: updated.organization,
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
