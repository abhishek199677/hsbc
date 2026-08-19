/**
 * Custom Branding & White-Label Configuration
 * Allows enterprise customers to fully customize the look and feel
 */

import { prisma } from "@/lib/prisma";

export interface BrandingConfig {
  id: string;
  organizationId: string;
  
  // Logo
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  
  // Typography
  fontFamily?: string | null;
  headingFont?: string | null;
  
  // Custom Domain
  customDomain?: string | null;
  domainVerified: boolean;
  sslEnabled: boolean;
  
  // White Label Settings
  hideTechcittaBranding: boolean;
  customFooterText?: string | null;
  customLoginMessage?: string | null;
  
  // Email Branding
  emailFromName?: string | null;
  emailFromAddress?: string | null;
  emailTemplateId?: string | null;
  
  // Legal Pages
  customTermsUrl?: string | null;
  customPrivacyUrl?: string | null;
}

export interface UpdateBrandingParams {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  fontFamily?: string;
  headingFont?: string;
  customDomain?: string;
  hideTechcittaBranding?: boolean;
  customFooterText?: string;
  customLoginMessage?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  emailTemplateId?: string;
  customTermsUrl?: string;
  customPrivacyUrl?: string;
}

/**
 * Get branding configuration for an organization
 */
export async function getBrandingConfig(
  organizationId: string
): Promise<BrandingConfig | null> {
  const config = await prisma.brandingConfiguration.findUnique({
    where: { organizationId },
  });

  if (!config) {
    // Return default branding
    return {
      id: "",
      organizationId,
      primaryColor: "#4f46e5",
      secondaryColor: "#7c3aed",
      accentColor: "#06b6d4",
      backgroundColor: "#ffffff",
      surfaceColor: "#f9fafb",
      textColor: "#111827",
      domainVerified: false,
      sslEnabled: true,
      hideTechcittaBranding: false,
    };
  }

  return config as BrandingConfig;
}

/**
 * Create or update branding configuration
 */
export async function upsertBrandingConfig(
  organizationId: string,
  params: UpdateBrandingParams
): Promise<BrandingConfig> {
  const existing = await prisma.brandingConfiguration.findUnique({
    where: { organizationId },
  });

  if (existing) {
    const updated = await prisma.brandingConfiguration.update({
      where: { organizationId },
      data: params,
    });
    return updated as BrandingConfig;
  }

  const created = await prisma.brandingConfiguration.create({
    data: {
      organizationId,
      ...params,
    },
  });

  return created as BrandingConfig;
}

/**
 * Generate CSS variables from branding config
 */
export function generateCSSVariables(config: BrandingConfig): string {
  return `
    --color-primary: ${config.primaryColor};
    --color-secondary: ${config.secondaryColor};
    --color-accent: ${config.accentColor};
    --color-background: ${config.backgroundColor};
    --color-surface: ${config.surfaceColor};
    --color-text: ${config.textColor};
    ${config.fontFamily ? `--font-family: ${config.fontFamily};` : ""}
    ${config.headingFont ? `--font-heading: ${config.headingFont};` : ""}
  `.trim();
}

/**
 * Generate Tailwind config extensions from branding
 */
export function generateTailwindConfig(config: BrandingConfig) {
  return {
    colors: {
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      accent: config.accentColor,
      background: config.backgroundColor,
      surface: config.surfaceColor,
      text: config.textColor,
    },
    fontFamily: {
      body: config.fontFamily || "inherit",
      heading: config.headingFont || "inherit",
    },
  };
}

/**
 * Check if custom domain is valid
 */
export function isValidCustomDomain(domain: string): boolean {
  // Basic domain validation
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
  return domainRegex.test(domain.toLowerCase());
}

/**
 * Verify domain ownership (placeholder - implement DNS TXT record verification)
 */
export async function verifyDomainOwnership(
  domain: string,
  organizationId: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    // In production, verify DNS TXT record
    // For now, just mark as verified
    await prisma.brandingConfiguration.update({
      where: { organizationId },
      data: { domainVerified: true },
    });

    return { verified: true };
  } catch {
    return { verified: false, error: "Domain verification failed" };
  }
}

/**
 * Get branding for organization by custom domain
 */
export async function getBrandingByDomain(
  domain: string
): Promise<BrandingConfig | null> {
  const config = await prisma.brandingConfiguration.findFirst({
    where: {
      customDomain: domain,
      domainVerified: true,
    },
  });

  return config as BrandingConfig | null;
}

/**
 * Generate custom login page content
 */
export function generateLoginPageContent(config: BrandingConfig) {
  return {
    showTechcittaBranding: !config.hideTechcittaBranding,
    customMessage: config.customLoginMessage,
    logoUrl: config.logoUrl,
    primaryColor: config.primaryColor,
  };
}

/**
 * Generate email template with custom branding
 */
export function generateEmailTemplate(
  config: BrandingConfig,
  content: { subject: string; body: string }
): { from: string; subject: string; html: string } {
  const fromName = config.emailFromName || "Techcitta";
  const fromAddress = config.emailFromAddress || "noreply@techcitta.com";

  const html = `
    <!DOCTYPE html>
    <<html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: ${config.fontFamily || "Arial, sans-serif"}; background: ${config.backgroundColor}; color: ${config.textColor}; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { max-height: 48px; }
        .content { background: ${config.surfaceColor}; border-radius: 12px; padding: 32px; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #6b7280; }
        .btn { display: inline-block; background: ${config.primaryColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" class="logo">` : ""}
        </div>
        <div class="content">
          ${content.body}
        </div>
        <div class="footer">
          ${config.customFooterText || `© ${new Date().getFullYear()} Techcitta. All rights reserved.`}
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    from: `${fromName} <${fromAddress}>`,
    subject: content.subject,
    html,
  };
}

/**
 * Get available branding presets
 */
export function getBrandingPresets() {
  return [
    {
      name: "Default",
      colors: {
        primaryColor: "#4f46e5",
        secondaryColor: "#7c3aed",
        accentColor: "#06b6d4",
        backgroundColor: "#ffffff",
        surfaceColor: "#f9fafb",
        textColor: "#111827",
      },
    },
    {
      name: "Corporate Blue",
      colors: {
        primaryColor: "#1d4ed8",
        secondaryColor: "#2563eb",
        accentColor: "#3b82f6",
        backgroundColor: "#f8fafc",
        surfaceColor: "#ffffff",
        textColor: "#0f172a",
      },
    },
    {
      name: "Modern Dark",
      colors: {
        primaryColor: "#8b5cf6",
        secondaryColor: "#a78bfa",
        accentColor: "#c4b5fd",
        backgroundColor: "#0f172a",
        surfaceColor: "#1e293b",
        textColor: "#f8fafc",
      },
    },
    {
      name: "Nature Green",
      colors: {
        primaryColor: "#059669",
        secondaryColor: "#10b981",
        accentColor: "#34d399",
        backgroundColor: "#f0fdf4",
        surfaceColor: "#ffffff",
        textColor: "#064e3b",
      },
    },
    {
      name: "Warm Sunset",
      colors: {
        primaryColor: "#ea580c",
        secondaryColor: "#f97316",
        accentColor: "#fb923c",
        backgroundColor: "#fff7ed",
        surfaceColor: "#ffffff",
        textColor: "#7c2d12",
      },
    },
  ];
}
