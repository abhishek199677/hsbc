import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { capturePayPalOrder, isPayPalConfigured } from "@/lib/paypal";
import { rateLimitByIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await rateLimitByIp(request, "capture-results", { limit: 10, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: "Payment is not configured.", paymentDisabled: true },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { orderId, interviewId } = body;
    if (!orderId || !interviewId) {
      return NextResponse.json({ error: "orderId and interviewId are required" }, { status: 400 });
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
      return NextResponse.json({ success: true, alreadyUnlocked: true });
    }

    const result = await capturePayPalOrder(orderId);

    if (result.status === "COMPLETED") {
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          resultsUnlocked: true,
          resultsPaymentId: orderId,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Payment not completed", status: result.status }, { status: 400 });
  } catch (error) {
    console.error("Capture unlock payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
