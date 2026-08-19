/**
 * Webhooks System for Enterprise
 * Event-driven notifications for external system integrations
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type WebhookEvent =
  | "interview.scheduled"
  | "interview.started"
  | "interview.completed"
  | "interview.cancelled"
  | "interview.evaluated"
  | "candidate.matched"
  | "candidate.shortlisted"
  | "user.created"
  | "user.verified"
  | "organization.updated"
  | "subscription.changed"
  | "subscription.cancelled";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  organizationId: string;
  data: Record<string, unknown>;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string;
}

/**
 * Generate webhook secret
 */
function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  organizationId: string,
  url: string,
  events: string[]
): Promise<{ id: string; secret: string }> {
  const secret = generateWebhookSecret();

  const webhook = await prisma.webhook.create({
    data: {
      organizationId,
      url,
      secret,
      events,
    },
  });

  return { id: webhook.id, secret };
}

/**
 * Update webhook configuration
 */
export async function updateWebhook(
  webhookId: string,
  organizationId: string,
  updates: { url?: string; events?: string[]; enabled?: boolean }
): Promise<boolean> {
  try {
    await prisma.webhook.update({
      where: {
        id: webhookId,
        organizationId,
      },
      data: updates,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(
  webhookId: string,
  organizationId: string
): Promise<boolean> {
  try {
    await prisma.webhook.delete({
      where: {
        id: webhookId,
        organizationId,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * List all webhooks for an organization
 */
export async function listWebhooks(organizationId: string) {
  return prisma.webhook.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      events: true,
      enabled: true,
      lastTriggeredAt: true,
      lastStatus: true,
      failureCount: true,
      createdAt: true,
    },
  });
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  organizationId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  // Find all webhooks subscribed to this event
  const webhooks = await prisma.webhook.findMany({
    where: {
      organizationId,
      enabled: true,
      events: { has: event },
    },
  });

  if (webhooks.length === 0) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    organizationId,
    data,
  };

  const payloadString = JSON.stringify(payload);

  // Trigger each webhook
  for (const webhook of webhooks) {
    await deliverWebhook(webhook, event, payloadString);
  }
}

/**
 * Deliver a webhook with retries
 */
async function deliverWebhook(
  webhook: { id: string; url: string; secret: string; maxRetries: number; retryDelayMs: number },
  event: string,
  payload: string
): Promise<void> {
  const signature = generateSignature(payload, webhook.secret);
  let attempt = 1;
  let success = false;

  while (attempt <= webhook.maxRetries && !success) {
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
          "X-Webhook-Attempt": attempt.toString(),
          "User-Agent": "Techcitta-Webhook/1.0",
        },
        body: payload,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      success = response.ok;

      // Log delivery attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          status: success ? "success" : "failed",
          statusCode: response.status,
          responseBody: await response.text().catch(() => ""),
          attempt,
        },
      });

      if (!success && attempt < webhook.maxRetries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, webhook.retryDelayMs));
      }
    } catch (error) {
      // Log failed attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          attempt,
        },
      });

      if (attempt < webhook.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, webhook.retryDelayMs));
      }
    }

    attempt++;
  }

  // Update webhook status
  await prisma.webhook.update({
    where: { id: webhook.id },
    data: {
      lastTriggeredAt: new Date(),
      lastStatus: success ? "success" : "failed",
      failureCount: success ? 0 : { increment: 1 },
    },
  });
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50
) {
  return prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(organizationId: string) {
  const [totalWebhooks, activeWebhooks, recentDeliveries, failedDeliveries] =
    await Promise.all([
      prisma.webhook.count({ where: { organizationId } }),
      prisma.webhook.count({ where: { organizationId, enabled: true } }),
      prisma.webhookDelivery.count({
        where: {
          webhook: { organizationId },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.webhookDelivery.count({
        where: {
          webhook: { organizationId },
          status: "failed",
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

  return {
    totalWebhooks,
    activeWebhooks,
    recentDeliveries,
    failedDeliveries,
    successRate:
      recentDeliveries > 0
        ? ((recentDeliveries - failedDeliveries) / recentDeliveries) * 100
        : 100,
  };
}

/**
 * Available webhook events with descriptions
 */
export const WEBHOOK_EVENTS: Record<WebhookEvent, { description: string; category: string }> = {
  "interview.scheduled": {
    description: "When a new interview is scheduled",
    category: "interviews",
  },
  "interview.started": {
    description: "When an interview begins",
    category: "interviews",
  },
  "interview.completed": {
    description: "When an interview is completed",
    category: "interviews",
  },
  "interview.cancelled": {
    description: "When an interview is cancelled",
    category: "interviews",
  },
  "interview.evaluated": {
    description: "When interview evaluation is ready",
    category: "interviews",
  },
  "candidate.matched": {
    description: "When a candidate is matched to a job",
    category: "candidates",
  },
  "candidate.shortlisted": {
    description: "When a candidate is shortlisted",
    category: "candidates",
  },
  "user.created": {
    description: "When a new user signs up",
    category: "users",
  },
  "user.verified": {
    description: "When a user verifies their email",
    category: "users",
  },
  "organization.updated": {
    description: "When organization settings change",
    category: "organization",
  },
  "subscription.changed": {
    description: "When subscription plan changes",
    category: "billing",
  },
  "subscription.cancelled": {
    description: "When a subscription is cancelled",
    category: "billing",
  },
};
