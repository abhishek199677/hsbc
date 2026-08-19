import { proxyToBackend } from "@/lib/proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, {
    method: "GET",
    path: `/api/interviews/${id}/next-question`,
  });
}
