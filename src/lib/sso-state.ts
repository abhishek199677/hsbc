/**
 * In-memory store for OIDC state/nonce with TTL.
 * For multi-server/production deployments, replace with Redis.
 */

interface PendingState {
  nonce: string;
  codeVerifier: string;
  organizationId: string;
  expiresAt: number;
}

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const stateStore = new Map<string, PendingState>();

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateStore) {
    if (value.expiresAt < now) {
      stateStore.delete(key);
    }
  }
}, 60_000);

export function persistOIDCState(
  state: string,
  nonce: string,
  codeVerifier: string,
  organizationId: string
): void {
  stateStore.set(state, {
    nonce,
    codeVerifier,
    organizationId,
    expiresAt: Date.now() + STATE_TTL_MS,
  });
}

export function consumeOIDCState(
  state: string
): { nonce: string; codeVerifier: string; organizationId: string } | null {
  const entry = stateStore.get(state);
  if (!entry) return null;
  stateStore.delete(state); // One-time use

  if (entry.expiresAt < Date.now()) return null;

  return {
    nonce: entry.nonce,
    codeVerifier: entry.codeVerifier,
    organizationId: entry.organizationId,
  };
}
