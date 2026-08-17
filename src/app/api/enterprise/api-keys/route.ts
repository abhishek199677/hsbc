/**
 * API Keys Management API
 * Create, list, and manage API keys for enterprise integrations
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApiKey, listApiKeys, revokeApiKey, toggleApiKey } from "@/lib/apikeys";
import { logSettingsEvent } from "@/lib/audit";

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

    const apiKeys = await listApiKeys(auth.organizationId);

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error("Failed to list API keys:", error);
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
    const { name, permissions, rateLimitPerMin, rateLimitPerDay, allowedIpAddresses, expiresAt } = body;

    if (!name) {
      return NextResponse.json({ error: "API key name is required" }, { status: 400 });
    }

    const result = await createApiKey({
      organizationId: auth.organizationId,
      name,
      permissions: permissions || [],
      rateLimitPerMin: rateLimitPerMin || 60,
      rateLimitPerDay: rateLimitPerDay || 10000,
      allowedIpAddresses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    // Log the creation
    await logSettingsEvent(
      auth.organizationId,
      "settings.api_key_created",
      {
        userId: auth.userId,
        metadata: { keyName: name, keyPrefix: result.keyPrefix },
      }
    );

    return NextResponse.json({
      success: true,
      apiKey: result,
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
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
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 });
    }

    const success = await revokeApiKey(keyId, auth.organizationId);

    if (!success) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Log the deletion
    await logSettingsEvent(
      auth.organizationId,
      "settings.api_key_deleted",
      {
        userId: auth.userId,
        metadata: { keyId },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete API key:", error);
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
    const { keyId, enabled } = body;

    if (!keyId) {
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 });
    }

    const success = await toggleApiKey(keyId, auth.organizationId, enabled);

    if (!success) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to toggle API key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
