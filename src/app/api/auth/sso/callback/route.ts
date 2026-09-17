/**
 * SSO Callback Handler
 * Processes SAML/OIDC responses and authenticates users.
 * Uses the same session system as regular login (techcitta_session cookie).
 */

import { NextRequest, NextResponse } from "next/server";
import { parseSAMLResponse, createOrUpdateSSOUser, exchangeOIDCCode, getOIDCUserInfo, type SSOProvider } from "@/lib/sso";
import { logAuthEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { samlResponse, state, organizationId, code } = body;

    if (!process.env.JWT_SECRET) {
      console.error("[sso] JWT_SECRET is not set — SSO cannot function");
      return NextResponse.json({ error: "SSO configuration error" }, { status: 500 });
    }

    // Get SSO configuration
    const ssoConfig = await prisma.sSOConfiguration.findUnique({
      where: { organizationId },
    });

    if (!ssoConfig || !ssoConfig.enabled) {
      return NextResponse.json({ error: "SSO not configured" }, { status: 400 });
    }

    let email: string | undefined;
    let name: string | undefined;
    let attributes: Record<string, string> = {};

    // Handle SAML response
    if (samlResponse) {
      const { profile, error } = parseSAMLResponse(samlResponse, ssoConfig as SSOProvider);
      
      if (error || !profile) {
        return NextResponse.json({ error: error || "Invalid SAML response" }, { status: 400 });
      }

      email = profile.email;
      name = profile.name;
      attributes = profile.attributes;
    }

    // Handle OIDC code exchange
    if (code && ssoConfig.oidcTokenUrl) {
      const { accessToken, error: tokenError } = await exchangeOIDCCode(
        ssoConfig as SSOProvider,
        code,
        state
      );

      if (tokenError || !accessToken) {
        return NextResponse.json({ error: tokenError || "OIDC token exchange failed" }, { status: 400 });
      }

      const { profile, error: userInfoError } = await getOIDCUserInfo(ssoConfig as SSOProvider, accessToken);
      
      if (userInfoError || !profile) {
        return NextResponse.json({ error: userInfoError || "Failed to get user info" }, { status: 400 });
      }

      email = profile.email;
      name = profile.name;
      attributes = profile.attributes;
    }

    if (!email) {
      return NextResponse.json({ error: "No email found in SSO response" }, { status: 400 });
    }

    // Create or update user
    const { userId, isNew } = await createOrUpdateSSOUser(
      organizationId,
      { email, name: name || email, attributes },
      ssoConfig as SSOProvider
    );

    // Get user for session creation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }

    // Create a proper session (same as regular login)
    const { token, expiresAt } = await createSession(user.id, user.organizationId);

    // Log the SSO login
    await logAuthEvent(organizationId, "user.sso_login", {
      userId: user.id,
      email: user.email,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: {
        isNewUser: isNew,
        provider: ssoConfig.provider,
      },
    });

    // Set the same session cookie as regular login
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      isNewUser: isNew,
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });

    return response;
  } catch (error) {
    console.error("SSO callback error:", error);
    return NextResponse.json({ error: "SSO authentication failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Handle SAML redirect (GET) - extract SAMLResponse from query params
  const { searchParams } = new URL(request.url);
  const samlResponse = searchParams.get("SAMLResponse");

  if (!samlResponse) {
    return NextResponse.redirect(new URL("/login?error=sso_failed", request.url));
  }

  // For GET requests (SAML redirect binding), redirect to the login page
  // with the SAML response, which will then make a POST to this endpoint
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(
    `${appUrl}/login?sso=callback&saml=${encodeURIComponent(samlResponse)}`
  );
}
