import { proxyToBackend } from "@/lib/proxy";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  return proxyToBackend(request, {
    method: "PATCH",
    path: `/api/agency/placements/${id}`,
    body: { ...body, id },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, {
    method: "DELETE",
    path: `/api/agency/placements/${id}`,
    requireAdmin: true,
  });
}
