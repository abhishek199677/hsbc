import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export type OrganizationRole = "owner" | "admin" | "interviewer" | "member" | "viewer";

export async function getActiveUser(request: Request) {
  const auth = await getUserFromRequest(request);
  if (!auth) return null;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      organization: true,
      teamMemberships: {
        where: { organizationId: auth.organizationId, acceptedAt: { not: null } },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (
    !user ||
    !user.emailVerifiedAt ||
    user.organizationId !== auth.organizationId ||
    user.organization.status !== "active"
  ) {
    return null;
  }

  const orgRole = user.teamMemberships[0]?.role ?? null;

  // Block admin/owner users who haven't set up 2FA
  const isAdminOrOwner = orgRole === "owner" || orgRole === "admin";
  if (isAdminOrOwner && !user.twoFactorEnabled) {
    return null;
  }

  return { ...user, organizationRole: orgRole };
}

export async function requireOrganizationRole(
  request: Request,
  allowedRoles: OrganizationRole[]
) {
  const user = await getActiveUser(request);
  if (!user?.organizationRole || !allowedRoles.includes(user.organizationRole as OrganizationRole)) {
    return null;
  }
  return user;
}
