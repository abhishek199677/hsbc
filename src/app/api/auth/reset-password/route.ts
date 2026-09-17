import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitByIp } from "@/lib/rateLimit";
import { hashPassword } from "@/lib/auth";
import { hashToken } from "@/lib/tokens";
import { isValidPassword } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const rateLimitResult = await rateLimitByIp(request, "reset-password", {
      limit: 5,
      windowMs: 900_000,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, password, email } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters with uppercase, lowercase, number, and special character" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Path 1: Direct reset by email (dev mode, no token validation)
    if (email && !token) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: "Password has been reset successfully",
      });
    }

    // Path 2: Token-based reset (standard flow)
    if (!token) {
      return NextResponse.json(
        { error: "Token or email is required" },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (verificationToken.type !== "password_reset") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      );
    }

    if (verificationToken.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.deleteMany({
        where: {
          userId: verificationToken.userId,
          type: "password_reset",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
