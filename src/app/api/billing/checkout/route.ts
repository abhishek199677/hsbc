import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationRole } from "@/lib/authorization";
import { getStripe, getPriceId, isStripeConfigured, isTaxEnabled } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rateLimit";
import { isSupportedCurrency } from "@/lib/pricing";

const PLANS = ["pro", "enterprise"] as const;

export async function POST(request: Request) {
  try {
    const user = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimit = await rateLimitByIp(request, "billing", { limit: 20, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Billing is not configured on this deployment.", billingDisabled: true },
        { status: 503 }
      );
    }

    const body = await request.json();
    const plan = body?.plan;
    if (typeof plan !== "string" || !PLANS.includes(plan as (typeof PLANS)[number])) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const currency = typeof body?.currency === "string" && isSupportedCurrency(body.currency)
      ? body.currency
      : "USD";

    const priceId = getPriceId(plan, currency);
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured for this plan" }, { status: 500 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: true },
    });
    if (!userData?.organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const org = userData.organization;
    const baseUrl = getAppBaseUrl();

    // Create a Stripe customer once per org.
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email || undefined,
        name: userData.name || org.name || undefined,
        metadata: { organizationId: org.id },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const tax = isTaxEnabled()
      ? { enabled: true }
      : { enabled: false };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: tax,
      success_url: `${baseUrl}/profile?checkout=success`,
      cancel_url: `${baseUrl}/profile?checkout=cancel`,
      client_reference_id: org.id,
      metadata: { organizationId: org.id, plan, currency },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
