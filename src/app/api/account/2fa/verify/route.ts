import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationRole } from "@/lib/authorization";
import { verifyTwoFactorToken } from "@/lib/two-factor";

export async function POST(request: Request) {
  try {
    const authUser = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, role: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json({ error: "Please setup 2FA first" }, { status: 400 });
    }

    const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ success: true, message: "2FA enabled successfully" });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
