/**
 * Branding Configuration API
 * Manage custom branding and white-label settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upsertBrandingConfig, getBrandingPresets } from "@/lib/branding";
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

    const brandingConfig = await prisma.brandingConfiguration.findUnique({
      where: { organizationId: auth.organizationId },
    });

    const presets = getBrandingPresets();

    return NextResponse.json({
      branding: brandingConfig || {
        primaryColor: "#4f46e5",
        secondaryColor: "#7c3aed",
        accentColor: "#06b6d4",
        backgroundColor: "#ffffff",
        surfaceColor: "#f9fafb",
        textColor: "#111827",
        hideTechcittaBranding: false,
      },
      presets,
    });
  } catch (error) {
    console.error("Failed to get branding config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      logoUrl,
      logoDarkUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      surfaceColor,
      textColor,
      fontFamily,
      headingFont,
      customDomain,
      hideTechcittaBranding,
      customFooterText,
      customLoginMessage,
      emailFromName,
      emailFromAddress,
      emailTemplateId,
      customTermsUrl,
      customPrivacyUrl,
    } = body;

    // Get current config for audit
    const currentConfig = await prisma.brandingConfiguration.findUnique({
      where: { organizationId: auth.organizationId },
    });

    // Upsert branding configuration
    const brandingConfig = await upsertBrandingConfig(auth.organizationId, {
      logoUrl,
      logoDarkUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      surfaceColor,
      textColor,
      fontFamily,
      headingFont,
      customDomain,
      hideTechcittaBranding,
      customFooterText,
      customLoginMessage,
      emailFromName,
      emailFromAddress,
      emailTemplateId,
      customTermsUrl,
      customPrivacyUrl,
    });

    // Update organization colors
    await prisma.organization.update({
      where: { id: auth.organizationId },
      data: {
        primaryColor: primaryColor || currentConfig?.primaryColor || "#4f46e5",
        accentColor: accentColor || currentConfig?.accentColor || "#7c3aed",
      },
    });

    // Log the change
    await logSettingsEvent(
      auth.organizationId,
      "settings.branding_updated",
      {
        userId: auth.userId,
        changes: {
          before: currentConfig ? { primaryColor: currentConfig.primaryColor } : null,
          after: { primaryColor },
        },
      }
    );

    return NextResponse.json({ success: true, branding: brandingConfig });
  } catch (error) {
    console.error("Failed to update branding config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
