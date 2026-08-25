import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { isPayPalConfigured, createPayPalOrder } from "@/lib/paypal";
import { rateLimitByIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await rateLimitByIp(request, "unlock-results", { limit: 10, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: "Payment is not configured on this deployment.", paymentDisabled: true },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { interviewId } = body;
    if (!interviewId || typeof interviewId !== "string") {
      return NextResponse.json({ error: "interviewId is required" }, { status: 400 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (interview.resultsUnlocked) {
      return NextResponse.json({ error: "Results already unlocked" }, { status: 400 });
    }

    const { orderId, approveUrl } = await createPayPalOrder(interviewId, user.userId);

    return NextResponse.json({ orderId, approveUrl });
  } catch (error) {
    console.error("Create unlock order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
