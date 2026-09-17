import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendEmail, generateVerificationEmail, getAppBaseUrl } from "@/lib/email";
import { isValidEmail, isValidPassword } from "@/lib/security";
import { rateLimitByIp } from "@/lib/rateLimit";
import { generateVerificationToken, hashToken, tokenExpiryDate } from "@/lib/tokens";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(request: Request) {
  try {
    const rateLimit = await rateLimitByIp(request, "signup", { limit: 5, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name, phone, role, orgName } = body;
    const accountRole = role === "employer" ? "employer" : "jobseeker";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters long and include uppercase, lowercase, number, and special character" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create (or reuse) an organization for this signup
    const orgDisplayName = (orgName || "").trim() || `${name || email.split("@")[0]}'s Workspace`;
    const baseSlug = slugify(orgName || name || "workspace") || "workspace";
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const organization = await prisma.organization.create({
      data: {
        name: orgDisplayName,
        slug,
        plan: "starter",
      },
    });

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
        role: accountRole,
        organizationId: organization.id,
        profile: { create: {} },
        ...(accountRole === "employer"
          ? {
            teamMemberships: {
              create: {
                organizationId: organization.id,
                role: "owner",
                acceptedAt: new Date(),
              },
            },
          }
          : {}),
      },
    });

    // Create email verification token
    const verifyToken = generateVerificationToken();
    await prisma.verificationToken.create({
      data: {
        token: hashToken(verifyToken),
        type: "email_verification",
        userId: user.id,
        expiresAt: tokenExpiryDate(),
      },
    });

    // Send verification email. Login remains blocked until verification succeeds.
    await sendEmail({
      to: user.email,
      subject: "Verify your HireRight email address",
      html: generateVerificationEmail(
        user.name || "there",
        `${getAppBaseUrl()}/verify-email?token=${verifyToken}`
      ),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
        emailVerified: !!user.emailVerifiedAt,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logoUrl,
        primaryColor: organization.primaryColor,
        accentColor: organization.accentColor,
        isGovernment: organization.isGovernment,
        plan: organization.plan,
        planStatus: organization.planStatus,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
