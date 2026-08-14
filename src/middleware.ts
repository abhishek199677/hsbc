import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), screen-share=(self)",
  },
];

const productionHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

function handleCors(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204 });
  }

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

function logRequest(
  request: NextRequest,
  response: NextResponse,
  startTime: number
) {
  const duration = Date.now() - startTime;
  const method = request.method;
  const path = request.nextUrl.pathname;
  const status = response.status;

  console.log(
    JSON.stringify({
      method,
      path,
      status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  );
}

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");

  let response: NextResponse;

  if (isApiRoute) {
    response = handleCors(request);
  } else {
    response = NextResponse.next();
  }

  for (const header of securityHeaders) {
    response.headers.set(header.key, header.value);
  }

  if (process.env.NODE_ENV === "production") {
    for (const header of productionHeaders) {
      response.headers.set(header.key, header.value);
    }
  }

  // Content Security Policy - allow LiveKit WebSocket, camera, microphone
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://*.cloudflare.com https://*.r2.cloudflarestorage.com data: blob:",
    "font-src 'self'",
    `connect-src 'self' https://*.cloudflare.com https://api.openai.com https://*.upstash.io https://*.sentry.io ${process.env.LIVEKIT_URL || "wss://livekit.hireright.com"} wss://*.livekit.cloud https://*.livekit.cloud ${process.env.NODE_ENV !== "production" ? "http://localhost:* ws://localhost:*" : ""}`,
    `media-src 'self' blob: https://*.r2.cloudflarestorage.com`,
    `frame-src 'none'`,
    `worker-src 'self' blob:`,
    `child-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  if (isApiRoute) {
    logRequest(request, response, startTime);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
