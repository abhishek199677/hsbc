import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationRole } from "@/lib/authorization";
import { revokeUserSessions } from "@/lib/auth";
import { generateVerificationToken, hashToken, tokenExpiryDate } from "@/lib/tokens";
import { sendEmail, getAppBaseUrl } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const requester = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!requester) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { organizationId: requester.organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, teamMembers });
  } catch (error) {
    console.error("Get team members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const requester = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!requester) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const validRoles = ["admin", "interviewer", "member", "viewer"];
    const assignedRole = validRoles.includes(role) ? role : "member";
    if (assignedRole === "admin" && requester.organizationRole !== "owner") {
      return NextResponse.json({ error: "Only the organization owner can invite admins" }, { status: 403 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in the org
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, organizationId: true },
    });

    if (existingUser) {
      // Check if already a team member in THIS org
      const existingMember = await prisma.teamMember.findUnique({
        where: { userId_organizationId: { userId: existingUser.id, organizationId: requester.organizationId } },
      });

      if (existingMember) {
        return NextResponse.json({ error: "User is already a team member" }, { status: 409 });
      }

      // Allow cross-org: add existing user (from another org) as team member in this org
      const teamMember = await prisma.teamMember.create({
        data: {
          userId: existingUser.id,
          organizationId: requester.organizationId,
          role: assignedRole,
          acceptedAt: new Date(),
        },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      return NextResponse.json({ success: true, teamMember });
    }

    // Generate invite token for new users
    const inviteToken = generateVerificationToken();

    // Create a pending team member entry (user doesn't exist yet)
    // We create a placeholder user so the invite link works
    const tempPassword = await import("@/lib/auth").then(m => m.hashPassword(inviteToken));

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: tempPassword,
        name: normalizedEmail.split("@")[0],
        role: "jobseeker",
        organizationId: requester.organizationId,
        emailVerifiedAt: null,
      },
    });

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: newUser.id,
        organizationId: requester.organizationId,
        role: assignedRole,
        inviteToken: hashToken(inviteToken),
        inviteExpiresAt: tokenExpiryDate(),
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    // Send invite email
    const baseUrl = getAppBaseUrl();
    const inviteUrl = `${baseUrl}/admin/team/invite?token=${inviteToken}`;

    await sendEmail({
      to: email,
      subject: `You've been invited to join ${requester.name || "HireRight"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Team Invitation</h1>
              <p>You've been invited to join ${requester.name || "HireRight"}</p>
            </div>
            <div class="content">
              <p>You've been invited as a <strong>${assignedRole}</strong>.</p>
              <p>Click the button below to accept the invitation and set up your account.</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
            </div>
            <div class="footer">
              <p>© 2026 HireRight. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, teamMember, inviteUrl });
  } catch (error) {
    console.error("Invite team member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const requester = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!requester) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { teamMemberId, role } = body;

    if (!teamMemberId || !role) {
      return NextResponse.json({ error: "teamMemberId and role are required" }, { status: 400 });
    }

    const validRoles = ["admin", "interviewer", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (role === "admin" && requester.organizationRole !== "owner") {
      return NextResponse.json({ error: "Only the organization owner can assign admins" }, { status: 403 });
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
      select: { organizationId: true, role: true },
    });

    if (!teamMember || teamMember.organizationId !== requester.organizationId) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    if (teamMember.role === "owner") {
      return NextResponse.json({ error: "Cannot change owner role" }, { status: 400 });
    }
    if (teamMember.role === "admin" && requester.organizationRole !== "owner") {
      return NextResponse.json({ error: "Only the organization owner can change admins" }, { status: 403 });
    }

    const updated = await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: { role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    // Revoke all sessions for the user whose role changed
    await revokeUserSessions(updated.userId);

    return NextResponse.json({ success: true, teamMember: updated });
  } catch (error) {
    console.error("Update team member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const requester = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!requester) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teamMemberId = searchParams.get("id");

    if (!teamMemberId) {
      return NextResponse.json({ error: "Team member ID is required" }, { status: 400 });
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
      select: { organizationId: true, role: true, userId: true },
    });

    if (!teamMember || teamMember.organizationId !== requester.organizationId) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    if (teamMember.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
    }
    if (teamMember.role === "admin" && requester.organizationRole !== "owner") {
      return NextResponse.json({ error: "Only the organization owner can remove admins" }, { status: 403 });
    }

    if (teamMember.userId === requester.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await prisma.teamMember.delete({
      where: { id: teamMemberId },
    });

    // Revoke all sessions for the removed user
    await revokeUserSessions(teamMember.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove team member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
