import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, isTokenExpired } from "@/lib/tokens";

async function verifyEmail(token: string, baseUrl: string) {
  if (!token) {
    return { success: false, error: "missing-token", redirect: `${baseUrl}/verify-email?error=missing-token` };
  }

  const hashedToken = hashToken(token);

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      token: hashedToken,
      type: "email_verification",
      usedAt: null,
    },
  });

  if (!verificationToken) {
    return { success: false, error: "invalid-token", redirect: `${baseUrl}/verify-email?error=invalid-token` };
  }

  if (isTokenExpired(verificationToken.expiresAt)) {
    return { success: false, error: "expired-token", redirect: `${baseUrl}/verify-email?error=expired-token` };
  }

  // Mark token as used
  await prisma.verificationToken.update({
    where: { id: verificationToken.id },
    data: { usedAt: new Date() },
  });

  // Update user's email verified timestamp
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerifiedAt: new Date() },
  });

  return { success: true, redirect: `${baseUrl}/verify-email?success=true` };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const baseUrl = new URL(request.url).origin;
    const result = await verifyEmail(token || "", baseUrl);
    return NextResponse.redirect(result.redirect);
  } catch (error) {
    console.error("Email verification error:", error);
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/verify-email?error=server-error`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;
    const baseUrl = new URL(request.url).origin;
    const result = await verifyEmail(token || "", baseUrl);

    if (result.success) {
      return NextResponse.json({ success: true, message: "Email verified successfully." });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ success: false, error: "server-error" }, { status: 500 });
  }
}
