import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitByIp } from "@/lib/rateLimit";
import { hashPassword } from "@/lib/auth";
import { hashToken } from "@/lib/tokens";
import { isValidPassword } from "@/lib/security";

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 requests per 15 minutes per IP
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
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters with uppercase, lowercase, number, and special character" },
        { status: 400 }
      );
    }

    // Find the verification token
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

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update password and delete the used token (and all other password_reset tokens for this user)
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
