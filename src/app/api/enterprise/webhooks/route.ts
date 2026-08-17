/**
 * Webhooks Management API
 * Create, list, and manage webhooks for enterprise integrations
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWebhook, listWebhooks, updateWebhook, deleteWebhook } from "@/lib/webhooks";
import { logAdminEvent } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const webhooks = await listWebhooks(auth.organizationId);

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Failed to list webhooks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { url, events } = body;

    if (!url) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "At least one event is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const result = await createWebhook(auth.organizationId, url, events);

    // Log the creation
    await logAdminEvent(
      auth.organizationId,
      "admin.webhook_created",
      {
        userId: auth.userId,
        metadata: { webhookUrl: url, events },
      }
    );

    return NextResponse.json({
      success: true,
      webhook: {
        id: result.id,
        url,
        events,
        secret: result.secret,
      },
    });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { webhookId, url, events, enabled } = body;

    if (!webhookId) {
      return NextResponse.json({ error: "Webhook ID is required" }, { status: 400 });
    }

    const success = await updateWebhook(webhookId, auth.organizationId, {
      url,
      events,
      enabled,
    });

    if (!success) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("id");

    if (!webhookId) {
      return NextResponse.json({ error: "Webhook ID is required" }, { status: 400 });
    }

    const success = await deleteWebhook(webhookId, auth.organizationId);

    if (!success) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Log the deletion
    await logAdminEvent(
      auth.organizationId,
      "admin.webhook_deleted",
      {
        userId: auth.userId,
        metadata: { webhookId },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
