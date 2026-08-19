import { proxyToBackend } from "@/lib/proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  return proxyToBackend(request, {
    method: "GET",
    path: `/api/agency/submissions${params ? `?${params}` : ""}`,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend(request, {
    method: "POST",
    path: "/api/agency/submissions",
    body,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  return proxyToBackend(request, {
    method: "PUT",
    path: "/api/agency/submissions",
    body,
  });
}
