/**
 * SSO/SAML Authentication for Enterprise
 * Supports Okta, Azure AD, OneLogin, Google Workspace, and custom SAML providers
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface SSOProvider {
  id: string;
  provider: string;
  providerName?: string | null;
  enabled: boolean;
  enforceSso: boolean;
  samlMetadataUrl?: string | null;
  samlEntityId?: string | null;
  samlSsoUrl?: string | null;
  samlSloUrl?: string | null;
  samlCertificate?: string | null;
  oidcClientId?: string | null;
  oidcClientSecret?: string | null;
  oidcIssuerUrl?: string | null;
  oidcAuthUrl?: string | null;
  oidcTokenUrl?: string | null;
  oidcUserInfoUrl?: string | null;
  oidcScopes?: string | null;
  defaultRole: string;
  emailAttribute: string;
  nameAttribute: string;
  roleAttribute?: string | null;
  groupsAttribute?: string | null;
}

export interface SAMLProfile {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  groups?: string[];
  attributes: Record<string, string>;
}

export interface SSOInitResult {
  redirectUrl: string;
  requestId: string;
}

export interface SSOCallbackResult {
  success: boolean;
  userId?: string;
  email?: string;
  name?: string;
  error?: string;
}

/**
 * Get SSO configuration for an organization
 */
export async function getSSOConfig(organizationId: string): Promise<SSOProvider | null> {
  const config = await prisma.sSOConfiguration.findUnique({
    where: { organizationId },
  });
  return config as SSOProvider | null;
}

/**
 * Check if SSO is enabled and enforced for an organization
 */
export async function isSSOEnforced(organizationId: string): Promise<boolean> {
  const config = await getSSOConfig(organizationId);
  return config?.enabled === true && config?.enforceSso === true;
}

/**
 * Generate SAML AuthnRequest
 */
export function generateSAMLAuthRequest(config: SSOProvider): SSOInitResult {
  const requestId = `_${crypto.randomUUID()}`;
  const issueInstant = new Date().toISOString();
  
  // Determine callback URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/auth/sso/callback`;
  
  // Build SAML AuthnRequest XML
  const authRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest 
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${config.samlSsoUrl}"
  AssertionConsumerServiceURL="${callbackUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${config.samlEntityId || appUrl}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>`;
  
  // Base64 encode
  const encodedRequest = Buffer.from(authRequest).toString("base64");
  
  // Build redirect URL
  const redirectUrl = `${config.samlSsoUrl}?SAMLRequest=${encodeURIComponent(encodedRequest)}`;
  
  return { redirectUrl, requestId };
}

/**
 * Parse SAML Response and extract user attributes
 */
export function parseSAMLResponse(
  samlResponse: string,
  config: SSOProvider
): { profile: SAMLProfile | null; error?: string } {
  try {
    // Decode base64
    const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");
    
    // Extract attributes (simplified - in production use a proper SAML library)
    const emailMatch = decoded.match(new RegExp(`<Attribute Name="${config.emailAttribute}"[^>]*>\\s*<AttributeValue>([^<]+)</AttributeValue>`, "i"));
    const nameMatch = decoded.match(new RegExp(`<Attribute Name="${config.nameAttribute}"[^>]*>\\s*<AttributeValue>([^<]+)</AttributeValue>`, "i"));
    
    if (!emailMatch) {
      return { profile: null, error: "Email attribute not found in SAML response" };
    }
    
    const email = emailMatch[1];
    const name = nameMatch ? nameMatch[1] : email.split("@")[0];
    
    // Extract groups if configured
    let groups: string[] | undefined;
    if (config.groupsAttribute) {
      const groupsMatch = decoded.match(new RegExp(`<Attribute Name="${config.groupsAttribute}"[^>]*>\\s*<AttributeValue>([^<]+)</AttributeValue>`, "i"));
      if (groupsMatch) {
        groups = groupsMatch[1].split(",").map(g => g.trim());
      }
    }
    
    // Map SSO groups to role if configured
    let role = config.defaultRole;
    if (config.roleAttribute && groups) {
      const roleMapping: Record<string, string> = {
        "admin": "admin",
        "interviewer": "interviewer",
        "viewer": "viewer",
        "member": "member",
      };
      
      for (const group of groups) {
        const lowerGroup = group.toLowerCase();
        if (roleMapping[lowerGroup]) {
          role = roleMapping[lowerGroup];
          break;
        }
      }
    }
    
    return {
      profile: {
        email,
        name,
        groups,
        attributes: {
          email,
          name,
          role,
        },
      },
    };
  } catch {
    return { profile: null, error: "Failed to parse SAML response" };
  }
}

/**
 * Validate SAML Response signature (placeholder - use a proper SAML library in production)
 */
export function validateSAMLSignature(
  samlResponse: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  certificate: string
): boolean {
  // In production, use a proper SAML library like passport-saml or saml2-js
  // This is a placeholder for the signature validation logic
  try {
    const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");
    // Check for signature element
    return decoded.includes("<ds:Signature") || decoded.includes("<Signature");
  } catch {
    return false;
  }
}

/**
 * Generate OIDC Authorization URL
 */
export function generateOIDCAuthUrl(config: SSOProvider): SSOInitResult {
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/sso/callback`;
  
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.oidcClientId || "",
    redirect_uri: redirectUri,
    scope: config.oidcScopes || "openid email profile",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  
  const redirectUrl = `${config.oidcAuthUrl}?${params.toString()}`;
  
  return { redirectUrl, requestId: state };
}

/**
 * Exchange OIDC authorization code for tokens
 */
export async function exchangeOIDCCode(
  config: SSOProvider,
  code: string,
  codeVerifier: string
): Promise<{ accessToken?: string; idToken?: string; error?: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/auth/sso/callback`;
    
    const response = await fetch(config.oidcTokenUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.oidcClientId || "",
        client_secret: config.oidcClientSecret || "",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    
    if (!response.ok) {
      return { error: "Failed to exchange authorization code" };
    }
    
    const data = await response.json();
    return {
      accessToken: data.access_token,
      idToken: data.id_token,
    };
  } catch {
    return { error: "OIDC token exchange failed" };
  }
}

/**
 * Get OIDC user info
 */
export async function getOIDCUserInfo(
  config: SSOProvider,
  accessToken: string
): Promise<{ profile: SAMLProfile | null; error?: string }> {
  try {
    const response = await fetch(config.oidcUserInfoUrl!, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      return { profile: null, error: "Failed to fetch user info" };
    }
    
    const data = await response.json();
    
    const email = data[config.emailAttribute] || data.email;
    const name = data[config.nameAttribute] || data.name || email?.split("@")[0];
    
    if (!email) {
      return { profile: null, error: "Email not found in OIDC response" };
    }
    
    return {
      profile: {
        email,
        name,
        attributes: data,
      },
    };
  } catch {
    return { profile: null, error: "OIDC user info fetch failed" };
  }
}

/**
 * Create or update user from SSO
 */
export async function createOrUpdateSSOUser(
  organizationId: string,
  profile: SAMLProfile,
  config: SSOProvider
): Promise<{ userId: string; isNew: boolean }> {
  const { email, name } = profile;
  
  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      organizationId,
    },
  });
  
  if (existingUser) {
    // Update last login
    return { userId: existingUser.id, isNew: false };
  }
  
  // Create new user
  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: crypto.randomBytes(32).toString("hex"), // Random password since SSO
      organizationId,
      emailVerifiedAt: new Date(), // SSO users are pre-verified
      role: "jobseeker",
    },
  });
  
  // Create team membership with default role
  await prisma.teamMember.create({
    data: {
      userId: newUser.id,
      organizationId,
      role: config.defaultRole,
      acceptedAt: new Date(),
    },
  });
  
  return { userId: newUser.id, isNew: true };
}

/**
 * Get SSO login page URL for an organization
 */
export function getSSOLoginUrl(organizationId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/login?sso=${organizationId}`;
}

/**
 * Check if organization has SSO configured
 */
export async function hasSSOConfigured(organizationId: string): Promise<boolean> {
  const config = await getSSOConfig(organizationId);
  return config?.enabled === true;
}

/**
 * Get SSO provider display name
 */
export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    okta: "Okta",
    azure_ad: "Microsoft Azure AD",
    onelogin: "OneLogin",
    google_workspace: "Google Workspace",
    custom_saml: "Custom SAML Provider",
    custom_oidc: "Custom OIDC Provider",
  };
  return names[provider] || provider;
}
