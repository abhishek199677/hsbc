import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
import { sendEmail, generateWelcomeEmail } from "@/lib/email";

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
    const body = await request.json();
    const { email, password, name, phone, role, orgName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    // Send welcome email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Welcome to ${organization.name}! 🚀`,
        html: generateWelcomeEmail(user.name || "there", organization.name),
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
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
