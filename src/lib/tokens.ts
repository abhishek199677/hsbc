import { createHash, randomBytes } from "crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenExpiryDate(): Date {
  return new Date(Date.now() + TOKEN_TTL_MS);
}

export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}
