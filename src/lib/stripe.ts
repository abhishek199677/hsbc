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
