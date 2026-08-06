import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Billing is not configured on this deployment.", billingDisabled: true },
        { status: 503 }
      );
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { organization: true },
    });
    const customerId = userData?.organization?.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppBaseUrl()}/profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
