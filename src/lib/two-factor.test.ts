import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  generateQRCode,
} from "./two-factor";

vi.mock("speakeasy", () => ({
  default: {
    generateSecret: vi.fn(() => ({
      base32: "JBSWY3DPEHPK3PXP",
      otpauth_url: "otpauth://totp/HireRight:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=HireRight",
    })),
    totp: {
      verify: vi.fn(({ token }: { token: string }) => token === "123456"),
    },
  },
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(async () => "data:image/png;base64,mockQR"),
  },
}));

describe("generateTwoFactorSecret", () => {
  it("returns secret and otpauthUrl", () => {
    const result = generateTwoFactorSecret("user@example.com");
    expect(result).toHaveProperty("secret");
    expect(result).toHaveProperty("otpauthUrl");
  });

  it("returns a base32 secret", () => {
    const { secret } = generateTwoFactorSecret("user@example.com");
    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
  });

  it("otpauthUrl contains the email", () => {
    const { otpauthUrl } = generateTwoFactorSecret("user@example.com");
    expect(otpauthUrl).toContain("user@example.com");
  });

  it("otpauthUrl contains issuer", () => {
    const { otpauthUrl } = generateTwoFactorSecret("user@example.com");
    expect(otpauthUrl).toContain("issuer=HireRight");
  });
});

describe("verifyTwoFactorToken", () => {
  it("returns true for valid token", () => {
    expect(verifyTwoFactorToken("JBSWY3DPEHPK3PXP", "123456")).toBe(true);
  });

  it("returns false for invalid token", () => {
    expect(verifyTwoFactorToken("JBSWY3DPEHPK3PXP", "000000")).toBe(false);
  });

  it("returns false for empty token", () => {
    expect(verifyTwoFactorToken("JBSWY3DPEHPK3PXP", "")).toBe(false);
  });
});

describe("generateQRCode", () => {
  it("returns a data URL", async () => {
    const result = await generateQRCode("otpauth://totp/test");
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
