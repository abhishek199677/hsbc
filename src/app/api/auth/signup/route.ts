import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
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
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
        role: role || "jobseeker",
        organizationId: organization.id,
      },
    });

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email, organization.id);

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

    // Send verification email (best-effort; login still works with a banner)
    await sendEmail({
      to: user.email,
      subject: "Verify your Techcitta email address",
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
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
