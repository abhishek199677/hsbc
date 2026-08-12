import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 5,
  admin: 4,
  interviewer: 3,
  member: 2,
  viewer: 1,
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["manage_team", "manage_billing", "manage_interviews", "view_interviews", "conduct_interviews", "view_candidates"],
  admin: ["manage_team", "manage_interviews", "view_interviews", "conduct_interviews", "view_candidates"],
  interviewer: ["view_interviews", "conduct_interviews", "view_candidates"],
  member: ["view_interviews", "view_candidates"],
  viewer: ["view_interviews"],
};

export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function requireRole(allowedRoles: string[]) {
  return async function checkRole(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { verifyToken } = await import("@/lib/auth");
    const auth = verifyToken(token);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { userId_organizationId: { userId: auth.userId, organizationId: auth.organizationId } },
      select: { role: true },
    });

    if (!teamMember || !allowedRoles.includes(teamMember.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return { auth, role: teamMember.role };
  };
}
