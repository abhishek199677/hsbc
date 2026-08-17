/**
 * SSO Configuration API
 * Manage SSO/SAML settings for enterprise organizations
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const ssoConfig = await prisma.sSOConfiguration.findUnique({
      where: { organizationId: auth.organizationId },
    });

    // Return sanitized config (never return secrets directly)
    return NextResponse.json({
      enabled: ssoConfig?.enabled || false,
      enforceSso: ssoConfig?.enforceSso || false,
      provider: ssoConfig?.provider,
      providerName: ssoConfig?.providerName,
      samlMetadataUrl: ssoConfig?.samlMetadataUrl,
      samlEntityId: ssoConfig?.samlEntityId,
      samlSsoUrl: ssoConfig?.samlSsoUrl,
      samlSloUrl: ssoConfig?.samlSloUrl,
      oidcClientId: ssoConfig?.oidcClientId,
      oidcIssuerUrl: ssoConfig?.oidcIssuerUrl,
      oidcAuthUrl: ssoConfig?.oidcAuthUrl,
      oidcScopes: ssoConfig?.oidcScopes,
      defaultRole: ssoConfig?.defaultRole || "member",
      emailAttribute: ssoConfig?.emailAttribute || "email",
      nameAttribute: ssoConfig?.nameAttribute || "name",
      roleAttribute: ssoConfig?.roleAttribute,
      groupsAttribute: ssoConfig?.groupsAttribute,
    });
  } catch (error) {
    console.error("Failed to get SSO config:", error);
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
      enabled,
      enforceSso,
      provider,
      providerName,
      samlMetadataUrl,
      samlEntityId,
      samlSsoUrl,
      samlSloUrl,
      samlCertificate,
      oidcClientId,
      oidcClientSecret,
      oidcIssuerUrl,
      oidcAuthUrl,
      oidcTokenUrl,
      oidcUserInfoUrl,
      oidcScopes,
      defaultRole,
      emailAttribute,
      nameAttribute,
      roleAttribute,
      groupsAttribute,
    } = body;

    // Get current config for audit
    const currentConfig = await prisma.sSOConfiguration.findUnique({
      where: { organizationId: auth.organizationId },
    });

    // Upsert SSO configuration
    const ssoConfig = await prisma.sSOConfiguration.upsert({
      where: { organizationId: auth.organizationId },
      create: {
        organizationId: auth.organizationId,
        enabled: enabled ?? false,
        enforceSso: enforceSso ?? false,
        provider: provider || "custom_saml",
        providerName,
        samlMetadataUrl,
        samlEntityId,
        samlSsoUrl,
        samlSloUrl,
        samlCertificate,
        oidcClientId,
        oidcClientSecret,
        oidcIssuerUrl,
        oidcAuthUrl,
        oidcTokenUrl,
        oidcUserInfoUrl,
        oidcScopes,
        defaultRole: defaultRole || "member",
        emailAttribute: emailAttribute || "email",
        nameAttribute: nameAttribute || "name",
        roleAttribute,
        groupsAttribute,
      },
      update: {
        enabled: enabled ?? false,
        enforceSso: enforceSso ?? false,
        provider: provider || "custom_saml",
        providerName,
        samlMetadataUrl,
        samlEntityId,
        samlSsoUrl,
        samlSloUrl,
        samlCertificate,
        oidcClientId,
        oidcClientSecret,
        oidcIssuerUrl,
        oidcAuthUrl,
        oidcTokenUrl,
        oidcUserInfoUrl,
        oidcScopes,
        defaultRole: defaultRole || "member",
        emailAttribute: emailAttribute || "email",
        nameAttribute: nameAttribute || "name",
        roleAttribute,
        groupsAttribute,
      },
    });

    // Update organization SSO status
    await prisma.organization.update({
      where: { id: auth.organizationId },
      data: {
        ssoEnabled: enabled ?? false,
        enforceSso: enforceSso ?? false,
      },
    });

    // Log the change
    await logSettingsEvent(
      auth.organizationId,
      "settings.sso_configured",
      {
        userId: auth.userId,
        changes: {
          before: currentConfig ? { enabled: currentConfig.enabled } : null,
          after: { enabled },
        },
        metadata: { provider },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update SSO config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
