import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateVerificationEmail, getAppBaseUrl } from "@/lib/email";
import { generateVerificationToken, hashToken, tokenExpiryDate } from "@/lib/tokens";
import { rateLimitByIp } from "@/lib/rateLimit";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const rateLimit = await rateLimitByIp(request, "resend-verification", { limit: 5, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Try to get email from JWT token first, then fall back to request body
    let email: string | null = null;
    const authUser = await getUserFromRequest(request);
    if (authUser?.email) {
      email = authUser.email;
    } else {
      try {
        const body = await request.json();
        email = body?.email || null;
      } catch {
        // Body may be empty or invalid JSON — that's fine, we'll handle below
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user || user.emailVerifiedAt) {
      return NextResponse.json({ success: true, message: "If that email is registered, a verification link has been sent." });
    }

    // Invalidate any existing unused verification tokens for this user
    await prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: "email_verification",
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Create new verification token
    const verifyToken = generateVerificationToken();
    await prisma.verificationToken.create({
      data: {
        token: hashToken(verifyToken),
        type: "email_verification",
        userId: user.id,
        expiresAt: tokenExpiryDate(),
      },
    });

    // Send verification email
    const verifyUrl = `${getAppBaseUrl()}/verify-email?token=${verifyToken}`;
    let emailSent = false;

    if (process.env.SMTP_USER) {
      try {
        const result = await sendEmail({
          to: user.email,
          subject: "Verify your Techcitta email address",
          html: generateVerificationEmail(
            user.name || "there",
            verifyUrl
          ),
        });
        emailSent = result.success && !result.devFallback;
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }
    }

    // Return the URL directly so it works with or without SMTP
    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Verification email sent. Please check your inbox."
        : "Verification link generated (email not configured).",
      verifyUrl,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
