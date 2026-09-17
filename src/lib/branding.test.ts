import { describe, it, expect, vi } from "vitest";

// Mock prisma to avoid DATABASE_URL requirement
vi.mock("./prisma", () => ({
  prisma: {
    organizationBranding: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import {
  generateCSSVariables,
  generateTailwindConfig,
  isValidCustomDomain,
  getBrandingPresets,
  generateLoginPageContent,
  generateEmailTemplate,
  type BrandingConfig,
} from "./branding";

const defaultBranding: BrandingConfig = {
  id: "b1",
  organizationId: "org-1",
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

describe("generateCSSVariables", () => {
  it("generates CSS variables for all colors", () => {
    const css = generateCSSVariables(defaultBranding);
    expect(css).toContain("--color-primary: #4f46e5");
    expect(css).toContain("--color-secondary: #7c3aed");
    expect(css).toContain("--color-accent: #06b6d4");
    expect(css).toContain("--color-background: #ffffff");
    expect(css).toContain("--color-surface: #f9fafb");
    expect(css).toContain("--color-text: #111827");
  });

  it("includes font variables when set", () => {
    const css = generateCSSVariables({
      ...defaultBranding,
      fontFamily: "Inter",
      headingFont: "Poppins",
    });
    expect(css).toContain("--font-family: Inter");
    expect(css).toContain("--font-heading: Poppins");
  });

  it("excludes font variables when not set", () => {
    const css = generateCSSVariables(defaultBranding);
    expect(css).not.toContain("--font-family");
    expect(css).not.toContain("--font-heading");
  });
});

describe("generateTailwindConfig", () => {
  it("returns correct color config", () => {
    const config = generateTailwindConfig(defaultBranding);
    expect(config.colors.primary).toBe("#4f46e5");
    expect(config.colors.secondary).toBe("#7c3aed");
    expect(config.colors.accent).toBe("#06b6d4");
  });

  it("uses inherit for missing fonts", () => {
    const config = generateTailwindConfig(defaultBranding);
    expect(config.fontFamily.body).toBe("inherit");
    expect(config.fontFamily.heading).toBe("inherit");
  });

  it("uses configured fonts when set", () => {
    const config = generateTailwindConfig({
      ...defaultBranding,
      fontFamily: "Inter",
      headingFont: "Poppins",
    });
    expect(config.fontFamily.body).toBe("Inter");
    expect(config.fontFamily.heading).toBe("Poppins");
  });
});

describe("isValidCustomDomain", () => {
  it("accepts valid domains", () => {
    expect(isValidCustomDomain("careers.example.com")).toBe(true);
    expect(isValidCustomDomain("myorg.io")).toBe(true);
    expect(isValidCustomDomain("company.co.uk")).toBe(true);
    expect(isValidCustomDomain("org123.com")).toBe(true);
  });

  it("rejects invalid domains", () => {
    expect(isValidCustomDomain("")).toBe(false);
    expect(isValidCustomDomain("just-a-name")).toBe(false);
    expect(isValidCustomDomain("-invalid.com")).toBe(false);
    expect(isValidCustomDomain("invalid-.com")).toBe(false);
    expect(isValidCustomDomain("spaces in.com")).toBe(false);
  });

  it("accepts uppercase domains (lowercased internally)", () => {
    expect(isValidCustomDomain("UPPERCASE.COM")).toBe(true);
  });
});

describe("getBrandingPresets", () => {
  it("returns at least one preset", () => {
    const presets = getBrandingPresets();
    expect(presets.length).toBeGreaterThan(0);
  });

  it("each preset has a name and colors", () => {
    const presets = getBrandingPresets();
    for (const preset of presets) {
      expect(preset.name).toBeTruthy();
      expect(preset.colors).toHaveProperty("primaryColor");
      expect(preset.colors).toHaveProperty("secondaryColor");
      expect(preset.colors).toHaveProperty("accentColor");
      expect(preset.colors).toHaveProperty("backgroundColor");
      expect(preset.colors).toHaveProperty("surfaceColor");
      expect(preset.colors).toHaveProperty("textColor");
    }
  });
});

describe("generateLoginPageContent", () => {
  it("shows techcitta branding by default", () => {
    const content = generateLoginPageContent(defaultBranding);
    expect(content.showTechcittaBranding).toBe(true);
  });

  it("hides techcitta branding when configured", () => {
    const content = generateLoginPageContent({
      ...defaultBranding,
      hideTechcittaBranding: true,
    });
    expect(content.showTechcittaBranding).toBe(false);
  });

  it("includes custom message when set", () => {
    const content = generateLoginPageContent({
      ...defaultBranding,
      customLoginMessage: "Welcome back!",
    });
    expect(content.customMessage).toBe("Welcome back!");
  });
});

describe("generateEmailTemplate", () => {
  it("generates from address from config", () => {
    const result = generateEmailTemplate(
      { ...defaultBranding, emailFromName: "MyOrg", emailFromAddress: "hello@myorg.com" },
      { subject: "Test", body: "<p>Hi</p>" }
    );
    expect(result.from).toBe("MyOrg <hello@myorg.com>");
  });

  it("defaults from address when not configured", () => {
    const result = generateEmailTemplate(defaultBranding, {
      subject: "Test",
      body: "<p>Hi</p>",
    });
    expect(result.from).toContain("Techcitta");
    expect(result.from).toContain("noreply@techcitta.com");
  });

  it("includes body content", () => {
    const result = generateEmailTemplate(defaultBranding, {
      subject: "Test",
      body: "<p>Hello World</p>",
    });
    expect(result.html).toContain("Hello World");
  });

  it("includes custom footer text", () => {
    const result = generateEmailTemplate(
      { ...defaultBranding, customFooterText: "Custom Footer" },
      { subject: "Test", body: "" }
    );
    expect(result.html).toContain("Custom Footer");
  });

  it("defaults footer to copyright", () => {
    const result = generateEmailTemplate(defaultBranding, { subject: "Test", body: "" });
    expect(result.html).toContain("Techcitta");
  });
});
