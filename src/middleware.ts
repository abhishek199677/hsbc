import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Web Crypto API works in Edge runtime (no Node.js 'crypto' import)
function generateRequestId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Route protection lists
// ---------------------------------------------------------------------------

/** API routes that require an authenticated session */
const PROTECTED_API_ROUTES = [
  "/api/profile",
  "/api/interview",
  "/api/interviews",
  "/api/ai-interview",
  "/api/ai-agent",
  "/api/ai/generate-summary",
  "/api/upload",
  "/api/files",
  "/api/account",
  "/api/billing",
  "/api/admin",
  "/api/enterprise",
  "/api/agency",
  "/api/chat",
  "/api/transcribe",
  "/api/livekit",
  "/api/feedback",
  "/api/reminders",
  "/api/proctor",
  "/api/sandbox",
  "/api/match",
  "/api/inngest",
];

/** Routes that are always public (no auth required) */
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/billing/webhook",
  "/api/files",
  "/api/health",
  "/api/sentry-example",
];

function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.some((p) => pathname.startsWith(p))) return false;
  return PROTECTED_API_ROUTES.some((p) => pathname.startsWith(p));
}

// ---------------------------------------------------------------------------
// Session verification
// ---------------------------------------------------------------------------

const SESSION_COOKIE = "techcitta_session";

// Tokens are generated with randomBytes(32).toString("base64url") = 43 chars.
// Enforce strict format to prevent garbage tokens from passing middleware.
const VALID_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

function extractSessionToken(request: NextRequest): string | null {
  const cookie = request.headers.get("cookie");
  const cookieMatch = cookie
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  if (cookieMatch) {
    try {
      const token = decodeURIComponent(cookieMatch.slice(SESSION_COOKIE.length + 1)) || null;
      if (token && token !== "cookie-session" && VALID_TOKEN_RE.test(token)) return token;
    } catch {
      return null;
    }
  }

  const auth = request.headers.get("authorization");
  const bearerMatch = auth?.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) {
    const token = bearerMatch[1].trim();
    if (token && token !== "cookie-session" && VALID_TOKEN_RE.test(token)) return token;
  }

  return null;
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

function handleCors(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const sameOrigin = origin === request.nextUrl.origin;
  const allowedOrigin = origin && (sameOrigin || configuredOrigins.includes(origin)) ? origin : null;

  const response = request.method === "OPTIONS"
    ? new NextResponse(null, { status: 204 })
    : NextResponse.next();

  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Request-ID");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
  }
  response.headers.set("Cache-Control", "no-store");

  return response;
}

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

function setSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------

function logRequest(
  requestId: string,
  request: NextRequest,
  response: NextResponse,
  startTime: number
) {
  const duration = Date.now() - startTime;
  console.log(
    JSON.stringify({
      level: "info",
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");

  // Generate request ID (use client-provided one if present for trace correlation)
  const requestId = request.headers.get("x-request-id") || generateRequestId();

  // ─── API Auth Protection ────────────────────────────────────────────
  if (isApiRoute && isProtectedRoute(pathname)) {
    const token = extractSessionToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-Request-ID", requestId);
    setSecurityHeaders(response);
    if (isApiRoute) logRequest(requestId, request, response, startTime);

    return response;
  }

  // ─── Non-protected routes ───────────────────────────────────────────
  let response: NextResponse;

  if (isApiRoute) {
    response = handleCors(request);
  } else {
    response = NextResponse.next();
  }

  response.headers.set("X-Request-ID", requestId);
  setSecurityHeaders(response);

  if (isApiRoute) {
    logRequest(requestId, request, response, startTime);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
