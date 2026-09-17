import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export const SESSION_COOKIE = "techcitta_session";

export interface AuthUser {
  sessionId: string;
  userId: string;
  email: string;
  organizationId: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(
  userId: string,
  organizationId: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      organizationId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

function getCookieToken(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  const match = cookie
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) || null;
  } catch {
    return null;
  }
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  const m = auth?.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

// Tokens are randomBytes(32).toString("base64url") = exactly 43 chars
const VALID_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

function getTokenCandidates(request: Request): string[] {
  const bearer = getBearerToken(request);
  const cookie = getCookieToken(request);
  const tokens: string[] = [];
  for (const t of [bearer, cookie]) {
    if (t && t !== "cookie-session" && VALID_TOKEN_RE.test(t)) {
      tokens.push(t);
    }
  }
  return [...new Set(tokens)];
}

export function getTokenFromRequest(request: Request): string | null {
  return getBearerToken(request) || getCookieToken(request);
}

async function resolveSession(token: string): Promise<AuthUser | null> {
  try {
    // Add timeout to prevent slow DB queries from blocking
    const result = await Promise.race([
      prisma.session.findUnique({
        where: { tokenHash: hashToken(token) },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          expiresAt: true,
          revokedAt: true,
          user: { select: { email: true } },
        },
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Session lookup timeout")), 3000)
      ),
    ]);

    if (!result) return null;
    
    const session = result as {
      id: string;
      userId: string;
      organizationId: string;
      expiresAt: Date;
      revokedAt: Date | null;
      user: { email: string };
    };

    if (session.revokedAt || session.expiresAt <= new Date()) return null;

    return {
      sessionId: session.id,
      userId: session.userId,
      email: session.user.email,
      organizationId: session.organizationId,
    };
  } catch (error) {
    // Log timeout errors but don't block the request
    if (error instanceof Error && error.message === "Session lookup timeout") {
      console.warn("Session lookup timed out for token");
    }
    return null;
  }
}

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  for (const token of getTokenCandidates(request)) {
    const user = await resolveSession(token);
    if (user) return user;
  }
  return null;
}

export async function revokeCurrentSession(request: Request): Promise<boolean> {
  for (const token of getTokenCandidates(request)) {
    const result = await prisma.session.updateMany({
      where: {
        tokenHash: hashToken(token),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
    if (result.count > 0) return true;
  }
  return false;
}

export async function revokeUserSessions(userId: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}
