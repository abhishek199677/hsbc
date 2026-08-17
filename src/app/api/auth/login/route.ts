import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { rateLimitByIp } from "@/lib/rateLimit";
import { verifyTwoFactorToken } from "@/lib/two-factor";

function parseUserAgent(ua: string | null) {
  if (!ua) return { device: "Unknown", browser: "Unknown", os: "Unknown" };
  
  let device = "Desktop";
  if (/mobile|android|iphone|ipad/i.test(ua)) device = "Mobile";
  else if (/tablet|ipad/i.test(ua)) device = "Tablet";
  
  let browser = "Unknown";
  if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";
  else if (/opera|opr/i.test(ua)) browser = "Opera";
  
  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";
  
  return { device, browser, os };
}

export async function POST(request: Request) {
  try {
    const rateLimit = await rateLimitByIp(request, "login", { limit: 10, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, twoFactorToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: true,
        teamMemberships: {
          where: { acceptedAt: { not: null } },
          select: { organizationId: true, role: true },
        },
      },
    });

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent");
    const { device, browser, os } = parseUserAgent(userAgent);

    if (!user) {
      // Log failed attempt for non-existent user
      await prisma.loginLog.create({
        data: {
          email: email.toLowerCase(),
          organizationId: "unknown",
          success: false,
          failureReason: "User not found",
          ipAddress,
          userAgent,
          device,
          browser,
          os,
        },
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      // Log failed login attempt
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          email: user.email,
          success: false,
          failureReason: "Invalid password",
          ipAddress,
          userAgent,
          device,
          browser,
          os,
        },
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.emailVerifiedAt) {
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          email: user.email,
          success: false,
          failureReason: "Email not verified",
          ipAddress,
          userAgent,
          device,
          browser,
          os,
        },
      });

      return NextResponse.json(
        { error: "Verify your email before signing in", emailVerificationRequired: true },
        { status: 403 }
      );
    }

    if (user.organization.status !== "active") {
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          email: user.email,
          success: false,
          failureReason: "Organization suspended",
          ipAddress,
          userAgent,
          device,
          browser,
          os,
        },
      });

      return NextResponse.json({ error: "This organization is suspended" }, { status: 403 });
    }

    const membership = user.teamMemberships.find(
      (candidate) => candidate.organizationId === user.organizationId
    );
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return NextResponse.json({ error: "Authentication code required", twoFactorRequired: true }, { status: 401 });
      }
      if (!user.twoFactorSecret || !verifyTwoFactorToken(user.twoFactorSecret, String(twoFactorToken))) {
        await prisma.loginLog.create({
          data: {
            userId: user.id,
            organizationId: user.organizationId,
            email: user.email,
            success: false,
            failureReason: "Invalid 2FA code",
            ipAddress,
            userAgent,
            device,
            browser,
            os,
          },
        });

        return NextResponse.json({ error: "Invalid authentication code", twoFactorRequired: true }, { status: 401 });
      }
    }

    const { token } = await createSession(user.id, user.organizationId);

    // Log successful login
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        success: true,
        ipAddress,
        userAgent,
        device,
        browser,
        os,
      },
    });

    const organization = user.organization;
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        organizationRole: membership?.role ?? null,
        organizationId: user.organizationId,
        emailVerified: !!user.emailVerifiedAt,
      },
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logoUrl: organization.logoUrl,
            primaryColor: organization.primaryColor,
            accentColor: organization.accentColor,
            isGovernment: organization.isGovernment,
            plan: organization.plan,
          }
        : null,
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    return response;
  } catch {
    console.error("Login failed due to an internal error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
