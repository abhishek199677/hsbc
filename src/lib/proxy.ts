import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";

export async function proxyToBackend(
  request: Request,
  options: {
    method: string;
    path: string;
    body?: unknown;
    requireAuth?: boolean;
    requireAdmin?: boolean;
  }
) {
  const { method, path, body, requireAuth = true, requireAdmin = false } = options;

  if (requireAuth) {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (requireAdmin) {
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        select: { role: true },
      });
      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") || "application/json",
  };

  const cookie = request.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const fetchOptions: RequestInit = { method, headers };

  if (body && method !== "GET") {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, fetchOptions);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Backend service unavailable",
        detail: error instanceof Error ? error.message : "Connection refused",
      },
      { status: 503 }
    );
  }
}

export async function proxyMultipartToBackend(
  request: Request,
  path: string
) {
  const authUser = await getUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  const headers: Record<string, string> = {};
  const cookie = request.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;
  const auth = request.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Backend service unavailable",
        detail: error instanceof Error ? error.message : "Connection refused",
      },
      { status: 503 }
    );
  }
}
