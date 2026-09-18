import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitByIp } from "@/lib/rateLimit";
import { sendEmail, generatePasswordResetEmail, getAppBaseUrl } from "@/lib/email";
import { generateVerificationToken, hashToken, tokenExpiryDate } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const rateLimitResult = await rateLimitByIp(request, "forgot-password", {
      limit: 3,
      windowMs: 900_000,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, we've sent a password reset link.",
      });
    }

    const resetToken = generateVerificationToken();
    const tokenHash = hashToken(resetToken);
    const resetUrl = `${getAppBaseUrl()}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Save the hashed token to the database
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        type: "password_reset",
        expiresAt: tokenExpiryDate(),
      },
    });

    // Try to send email, but always return the URL so the user can reset
    if (process.env.SMTP_USER) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Techcitta password",
          html: generatePasswordResetEmail(user.name || "there", resetUrl),
        });
      } catch (emailErr) {
        console.error("Email send failed, returning reset URL directly:", emailErr);
      }
    }

    // Always return the reset URL (works with or without SMTP)
    return NextResponse.json({
      success: true,
      message: process.env.SMTP_USER
        ? "Password reset link sent to your email."
        : "Password reset link generated (email not configured).",
      resetUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
