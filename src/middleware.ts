import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
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
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

function logRequest(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
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
    }),
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

  if (isApiRoute) {
    logRequest(request, response, startTime);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
