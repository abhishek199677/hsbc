import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceIds, isStripeConfigured } from "@/lib/stripe";

function planFromPriceId(priceId: string | null): string {
  const ids = getPriceIds();
  if (priceId && priceId === ids.pro) return "pro";
  if (priceId && priceId === ids.enterprise) return "enterprise";
  return "starter";
}

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const payload = await request.text();
    let event: import("stripe").Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const organizationId =
          session.metadata?.organizationId || session.client_reference_id;
        if (organizationId) {
          const plan = session.metadata?.plan || "pro";
          const ids = getPriceIds();
          const priceId = plan === "enterprise" ? ids.enterprise : ids.pro;
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              stripeCustomerId: (session.customer as string) || undefined,
              stripeSubscriptionId: (session.subscription as string) || undefined,
              stripePriceId: priceId || undefined,
              planStatus: "active",
              plan,
              trialEndsAt: null,
            },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as import("stripe").Stripe.Subscription;
        const status = subscription.status;
        const plan = planFromPriceId(
          typeof subscription.items.data[0]?.price?.id === "string"
            ? subscription.items.data[0].price.id
            : null
        );
        const planStatus =
          status === "active" ? "active"
          : status === "trialing" ? "trialing"
          : status === "past_due" ? "past_due"
          : status === "canceled" ? "canceled"
          : status === "unpaid" ? "unpaid"
          : "inactive";

        await prisma.organization.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            planStatus,
            plan,
            stripePriceId: (typeof subscription.items.data[0]?.price?.id === "string"
              ? subscription.items.data[0].price.id
              : null) || undefined,
          },
        });
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
