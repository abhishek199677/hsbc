import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitByIp } from "@/lib/rateLimit";
import { sendEmail, generatePasswordResetEmail, getAppBaseUrl } from "@/lib/email";
import { generateVerificationToken, hashToken, tokenExpiryDate } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    // Rate limiting: 3 requests per 15 minutes per IP
    const rateLimitResult = await rateLimitByIp(request, "forgot-password", { 
      limit: 3, 
      windowMs: 900_000 // 15 minutes
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

    // Always return success to prevent user enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: "If an account exists with that email, we've sent a password reset link.",
    });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success even if user doesn't exist (prevent enumeration)
      return successResponse;
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    await prisma.verificationToken.create({
      data: {
        token: hashToken(resetToken),
        type: "password_reset",
        userId: user.id,
        expiresAt: tokenExpiryDate(),
      },
    });

    // Send reset email (or return token directly if SMTP not configured)
    if (process.env.SMTP_USER) {
      await sendEmail({
        to: user.email,
        subject: "Reset your Techcitta password",
        html: generatePasswordResetEmail(
          user.name || "there",
          `${getAppBaseUrl()}/reset-password?token=${resetToken}`
        ),
      });
      return successResponse;
    } else {
      // Dev mode: return token directly when SMTP is not configured
      return NextResponse.json({
        success: true,
        message: "Password reset token generated (email not configured).",
        resetToken,
        resetUrl: `${getAppBaseUrl()}/reset-password?token=${resetToken}`,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    // Return generic error to prevent information leakage
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
