import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceIds, isStripeConfigured } from "@/lib/stripe";

function planFromPriceId(priceId: string | null): string {
  const ids = getPriceIds();
  if (priceId && priceId === ids.pro) return "pro";
  if (priceId && priceId === ids.enterprise) return "enterprise";
  return "starter";
}

// ---------------------------------------------------------------------------
// Event ID deduplication — prevents processing Stripe retries
// ---------------------------------------------------------------------------

const processedEvents = new Map<string, number>();
const EVENT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isDuplicateEvent(eventId: string): boolean {
  const now = Date.now();
  // Clean expired entries periodically
  if (processedEvents.size > 1000) {
    for (const [id, ts] of processedEvents) {
      if (now - ts > EVENT_TTL_MS) processedEvents.delete(id);
    }
  }
  if (processedEvents.has(eventId)) return true;
  processedEvents.set(eventId, now);
  return false;
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

    // Deduplication — skip already-processed events
    if (isDuplicateEvent(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      // ─── Checkout Complete ──────────────────────────────────────
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

      // ─── Subscription Updated / Deleted ─────────────────────────
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as import("stripe").Stripe.Subscription;
        const status = subscription.status;
        const priceId = typeof subscription.items.data[0]?.price?.id === "string"
          ? subscription.items.data[0].price.id
          : null;
        const plan = planFromPriceId(priceId);
        const planStatus =
          status === "active" ? "active"
          : status === "trialing" ? "trialing"
          : status === "past_due" ? "past_due"
          : status === "canceled" ? "canceled"
          : status === "unpaid" ? "unpaid"
          : "inactive";

        // On cancellation or unpaid, downgrade to starter
        const effectivePlan = (planStatus === "canceled" || planStatus === "unpaid")
          ? "starter"
          : plan;

        await prisma.organization.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            planStatus,
            plan: effectivePlan,
            stripePriceId: priceId || undefined,
          },
        });
        break;
      }

      // ─── Payment Failed ────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as import("stripe").Stripe.Invoice;
        const subId = (invoice as unknown as Record<string, unknown>).subscription;
        const subscriptionId = typeof subId === "string" ? subId : null;
        if (subscriptionId) {
          await prisma.organization.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { planStatus: "past_due" },
          });
        }
        break;
      }

      // ─── Trial Will End (3 days before) ────────────────────────
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as import("stripe").Stripe.Subscription;
        const trialEnd = typeof subscription.trial_end === "number"
          ? new Date(subscription.trial_end * 1000)
          : null;
        if (trialEnd) {
          await prisma.organization.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: { trialEndsAt: trialEnd },
          });
        }
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
