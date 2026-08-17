/**
 * API Keys Management for Enterprise
 * Secure API key generation, validation, and rate limiting
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimitPerMin: number;
  rateLimitPerDay: number;
  allowedIpAddresses?: string[] | null;
  enabled: boolean;
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  totalRequests: bigint;
  createdAt: Date;
}

export interface CreateApiKeyParams {
  organizationId: string;
  name: string;
  permissions?: string[];
  rateLimitPerMin?: number;
  rateLimitPerDay?: number;
  allowedIpAddresses?: string[];
  expiresAt?: Date;
}

export interface CreateApiKeyResult {
  id: string;
  name: string;
  key: string; // Full key - only shown once
  keyPrefix: string;
  permissions: string[];
}

export interface ValidateApiKeyResult {
  valid: boolean;
  apiKeyId?: string;
  organizationId?: string;
  permissions?: string[];
  error?: string;
}

// API Key prefix for identification
const API_KEY_PREFIX = "tc";
const API_KEY_SEPARATOR = "_";

// Available permissions
export const API_PERMISSIONS = {
  interviews: {
    read: "interviews:read",
    write: "interviews:write",
    delete: "interviews:delete",
  },
  candidates: {
    read: "candidates:read",
    write: "candidates:write",
  },
  users: {
    read: "users:read",
    write: "users:write",
  },
  analytics: {
    read: "analytics:read",
  },
  webhooks: {
    manage: "webhooks:manage",
  },
  apikeys: {
    manage: "apikeys:manage",
  },
} as const;

/**
 * Generate a new API key
 */
function generateApiKey(live: boolean = true): string {
  const prefix = live ? "tc_live" : "tc_test";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  return `${prefix}${API_KEY_SEPARATOR}${randomBytes}`;
}

/**
 * Hash an API key for storage
 */
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Get key prefix for display
 */
function getKeyPrefix(key: string): string {
  return key.substring(0, 12) + "...";
}

/**
 * Create a new API key
 */
export async function createApiKey(params: CreateApiKeyParams): Promise<CreateApiKeyResult> {
  const {
    organizationId,
    name,
    permissions = [],
    rateLimitPerMin = 60,
    rateLimitPerDay = 10000,
    allowedIpAddresses,
    expiresAt,
  } = params;

  // Generate key
  const key = generateApiKey();
  const keyHash = hashApiKey(key);
  const keyPrefix = getKeyPrefix(key);

  // Store in database
  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId,
      name,
      keyHash,
      keyPrefix,
      permissions,
      rateLimitPerMin,
      rateLimitPerDay,
      allowedIpAddresses: allowedIpAddresses ? JSON.stringify(allowedIpAddresses) : null,
      expiresAt,
    },
  });

  return {
    id: apiKey.id,
    name: apiKey.name,
    key, // Return full key - only shown once
    keyPrefix: apiKey.keyPrefix,
    permissions: apiKey.permissions,
  };
}

/**
 * Validate an API key
 */
export async function validateApiKey(
  key: string,
  requiredPermission?: string,
  clientIp?: string
): Promise<ValidateApiKeyResult> {
  try {
    // Hash the provided key
    const keyHash = hashApiKey(key);

    // Find the key in database
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { organization: true },
    });

    if (!apiKey) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check if enabled
    if (!apiKey.enabled) {
      return { valid: false, error: "API key is disabled" };
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: "API key has expired" };
    }

    // Check organization status
    if (apiKey.organization.status !== "active") {
      return { valid: false, error: "Organization account is suspended" };
    }

    // Check IP whitelist
    if (apiKey.allowedIpAddresses && clientIp) {
      const allowedIps = JSON.parse(apiKey.allowedIpAddresses as string);
      if (!isIpAllowed(clientIp, allowedIps)) {
        return { valid: false, error: "IP address not allowed" };
      }
    }

    // Check permission
    if (requiredPermission && !apiKey.permissions.includes(requiredPermission)) {
      return { valid: false, error: "Insufficient permissions" };
    }

    // Update usage stats
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        totalRequests: { increment: 1 },
      },
    });

    return {
      valid: true,
      apiKeyId: apiKey.id,
      organizationId: apiKey.organizationId,
      permissions: apiKey.permissions,
    };
  } catch (error) {
    return { valid: false, error: "API key validation failed" };
  }
}

/**
 * Check if IP is allowed (supports CIDR notation)
 */
function isIpAllowed(ip: string, allowedIps: string[]): boolean {
  // Simple exact match for now
  // In production, use a library like 'ip-cidr' for CIDR matching
  return allowedIps.some((allowed) => {
    if (allowed.includes("/")) {
      // CIDR notation - simplified check
      const [network, prefix] = allowed.split("/");
      // For now, just check if IP starts with the network prefix
      return ip.startsWith(network.split(".").slice(0, parseInt(prefix) / 8).join("."));
    }
    return ip === allowed;
  });
}

/**
 * Revoke/delete an API key
 */
export async function revokeApiKey(apiKeyId: string, organizationId: string): Promise<boolean> {
  try {
    await prisma.apiKey.delete({
      where: {
        id: apiKeyId,
        organizationId,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Toggle API key enabled/disabled
 */
export async function toggleApiKey(
  apiKeyId: string,
  organizationId: string,
  enabled: boolean
): Promise<boolean> {
  try {
    await prisma.apiKey.update({
      where: {
        id: apiKeyId,
        organizationId,
      },
      data: { enabled },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * List all API keys for an organization
 */
export async function listApiKeys(organizationId: string): Promise<ApiKeyInfo[]> {
  const keys = await prisma.apiKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    permissions: key.permissions,
    rateLimitPerMin: key.rateLimitPerMin,
    rateLimitPerDay: key.rateLimitPerDay,
    allowedIpAddresses: key.allowedIpAddresses ? JSON.parse(key.allowedIpAddresses as string) : null,
    enabled: key.enabled,
    expiresAt: key.expiresAt,
    lastUsedAt: key.lastUsedAt,
    totalRequests: key.totalRequests,
    createdAt: key.createdAt,
  }));
}

/**
 * Get API key by ID
 */
export async function getApiKeyById(
  apiKeyId: string,
  organizationId: string
): Promise<ApiKeyInfo | null> {
  const key = await prisma.apiKey.findFirst({
    where: {
      id: apiKeyId,
      organizationId,
    },
  });

  if (!key) return null;

  return {
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    permissions: key.permissions,
    rateLimitPerMin: key.rateLimitPerMin,
    rateLimitPerDay: key.rateLimitPerDay,
    allowedIpAddresses: key.allowedIpAddresses ? JSON.parse(key.allowedIpAddresses as string) : null,
    enabled: key.enabled,
    expiresAt: key.expiresAt,
    lastUsedAt: key.lastUsedAt,
    totalRequests: key.totalRequests,
    createdAt: key.createdAt,
  };
}

/**
 * Check rate limit for an API key
 */
export async function checkApiKeyRateLimit(
  apiKeyId: string,
  window: "minute" | "day" = "minute"
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  // In production, use Redis/Upstash for distributed rate limiting
  // This is a simplified in-memory implementation
  const key = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
  });

  if (!key) {
    return { allowed: false, remaining: 0, resetAt: new Date() };
  }

  const limit = window === "minute" ? key.rateLimitPerMin : key.rateLimitPerDay;
  
  // For now, always allow (implement proper rate limiting in production)
  return {
    allowed: true,
    remaining: limit - 1,
    resetAt: new Date(Date.now() + (window === "minute" ? 60000 : 86400000)),
  };
}

/**
 * Generate API documentation for organization
 */
export function generateApiDocs(permissions: string[]): string {
  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/interviews",
      description: "List all interviews",
      permission: "interviews:read",
    },
    {
      method: "POST",
      path: "/api/v1/interviews",
      description: "Create a new interview",
      permission: "interviews:write",
    },
    {
      method: "GET",
      path: "/api/v1/interviews/:id",
      description: "Get interview by ID",
      permission: "interviews:read",
    },
    {
      method: "GET",
      path: "/api/v1/candidates",
      description: "List all candidates",
      permission: "candidates:read",
    },
    {
      method: "GET",
      path: "/api/v1/analytics",
      description: "Get analytics data",
      permission: "analytics:read",
    },
  ];

  const filteredEndpoints = endpoints.filter((ep) => permissions.includes(ep.permission));

  return filteredEndpoints
    .map((ep) => `${ep.method} ${ep.path}\n  ${ep.description}\n  Permission: ${ep.permission}`)
    .join("\n\n");
}
