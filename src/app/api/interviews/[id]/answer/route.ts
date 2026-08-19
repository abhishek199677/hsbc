import { proxyToBackend } from "@/lib/proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  return proxyToBackend(request, {
    method: "POST",
    path: `/api/interviews/${id}/answer`,
    body,
  });
}
