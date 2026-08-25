"use client";

import { useEffect, useState } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { Loader, CheckCircle, AlertCircle } from "lucide-react";

interface PayPalUnlockButtonProps {
  interviewId: string;
  priceUsd: number;
  onUnlockSuccess: () => void;
}

function PayPalButtonsInner({
  interviewId,
  onUnlockSuccess,
}: {
  interviewId: string;
  onUnlockSuccess: () => void;
}) {
  const [{ options, isPending }] = usePayPalScriptReducer();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = options["client-id"] || "";

  if (!clientId) {
    return (
      <div className="text-center py-4 text-red-600 text-sm">
        PayPal is not configured. Please contact support.
      </div>
    );
  }

  return (
    <>
      {isPending && (
        <div className="flex items-center justify-center gap-2 py-4 text-gray-500 text-sm">
          <Loader className="w-4 h-4 animate-spin" />
          Loading PayPal...
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <PayPalButtons
        style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
        disabled={creating}
        createOrder={async () => {
          setCreating(true);
          setError(null);
          try {
            const res = await fetch("/api/billing/unlock-results", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ interviewId }),
              credentials: "same-origin",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create order");
            return data.orderId;
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment failed to start");
            throw err;
          } finally {
            setCreating(false);
          }
        }}
        onApprove={async (data) => {
          setCreating(true);
          setError(null);
          try {
            const res = await fetch("/api/billing/unlock-results/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID, interviewId }),
              credentials: "same-origin",
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to capture payment");
            onUnlockSuccess();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment capture failed");
          } finally {
            setCreating(false);
          }
        }}
        onError={(err) => {
          setError("Payment failed. Please try again.");
          console.error("PayPal error:", err);
        }}
      />
      {creating && (
        <div className="flex items-center justify-center gap-2 py-2 text-indigo-600 text-sm">
          <Loader className="w-4 h-4 animate-spin" />
          Processing payment...
        </div>
      )}
    </>
  );
}

export default function PayPalUnlockButton({
  interviewId,
  priceUsd,
  onUnlockSuccess,
}: PayPalUnlockButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  if (!clientId) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Payment system is not configured.
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        "client-id": clientId,
        currency: "USD",
        intent: "capture",
      } as unknown as React.ComponentProps<typeof PayPalScriptProvider>["options"]}
    >
      <div className="w-full">
        <PayPalButtonsInner
          interviewId={interviewId}
          onUnlockSuccess={onUnlockSuccess}
        />
      </div>
    </PayPalScriptProvider>
  );
}
