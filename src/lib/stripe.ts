import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export function getPriceIds(): { pro: string | null; enterprise: string | null } {
  return {
    pro: process.env.STRIPE_PRICE_PRO || null,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE || null,
  };
}

/**
 * Resolve the Stripe Price ID for a plan in the requested currency.
 * Prefers a currency-specific price (`STRIPE_PRICE_PRO_USD`, etc.) and falls
 * back to the plan's default price. Returns null when nothing is configured.
 */
export function getPriceId(plan: string, currency: string): string | null {
  const specific = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_${currency.toUpperCase()}`];
  if (specific) return specific;
  return getPriceIds()[plan as "pro" | "enterprise"] || null;
}

/** When enabled (STRIPE_TAX_ENABLED="true"), Stripe Tax is collected at checkout. */
export function isTaxEnabled(): boolean {
  return process.env.STRIPE_TAX_ENABLED === "true";
}
