import { proxyToBackend } from "@/lib/proxy";

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend(request, {
    method: "POST",
    path: "/api/match",
    body,
  });
}
