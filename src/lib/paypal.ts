const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

export function getPayPalConfig() {
  return {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    apiBase: PAYPAL_API_BASE,
    unlockPriceUsd: Number(process.env.RESULTS_UNLOCK_PRICE_USD || "5.99"),
  };
}

export function isPayPalConfigured(): boolean {
  const { clientId, clientSecret } = getPayPalConfig();
  return Boolean(clientId && clientSecret);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const { clientId, clientSecret, apiBase } = getPayPalConfig();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal token error: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export async function createPayPalOrder(interviewId: string, userId: string): Promise<{ orderId: string; approveUrl: string }> {
  const token = await getPayPalAccessToken();
  const { apiBase, unlockPriceUsd } = getPayPalConfig();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${apiBase}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: interviewId,
          amount: {
            currency_code: "USD",
            value: unlockPriceUsd.toFixed(2),
          },
          description: "Unlock Interview Results",
          custom_id: JSON.stringify({ interviewId, userId }),
        },
      ],
      application_context: {
        return_url: `${baseUrl}/api/billing/unlock-results/capture`,
        cancel_url: `${baseUrl}/interview/live?unlock=cancel`,
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal order creation failed: ${err}`);
  }

  const data = await res.json();
  const approveUrl = data.links?.find((l: { rel: string }) => l.rel === "approve")?.href;
  return { orderId: data.id, approveUrl };
}

export async function capturePayPalOrder(orderId: string): Promise<{ status: string; payerId?: string }> {
  const token = await getPayPalAccessToken();
  const { apiBase } = getPayPalConfig();

  const res = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }

  const data = await res.json();
  return {
    status: data.status,
    payerId: data.payer?.payer_id,
  };
}
