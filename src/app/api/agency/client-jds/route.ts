import { proxyToBackend } from "@/lib/proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  return proxyToBackend(request, {
    method: "GET",
    path: `/api/agency/client-jds${params ? `?${params}` : ""}`,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend(request, {
    method: "POST",
    path: "/api/agency/client-jds",
    body,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  return proxyToBackend(request, {
    method: "PUT",
    path: "/api/agency/client-jds",
    body,
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  return proxyToBackend(request, {
    method: "DELETE",
    path: `/api/agency/client-jds?id=${id}`,
    requireAdmin: true,
  });
}
