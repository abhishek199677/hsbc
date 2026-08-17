import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { role: true, organizationId: true },
    });

    if (!user || (user.role !== "admin" && user.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, string> = { organizationId: user.organizationId };
    if (status) where.status = status;
    if (type) where.type = type;

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const total = await prisma.feedback.count({ where });

    return NextResponse.json({ success: true, feedback, total });
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { role: true, organizationId: true },
    });

    if (!user || (user.role !== "admin" && user.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    const existing = await prisma.feedback.findFirst({
      where: { id, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Feedback not found" }, { status: 404 });

    const feedback = await prisma.feedback.update({
      where: { id: existing.id },
      data: { status },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Update feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
