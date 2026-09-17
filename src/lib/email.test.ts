import { describe, it, expect, vi } from "vitest";
import {
  getAppBaseUrl,
  generateInterviewConfirmationEmail,
  generateReminderEmail,
  generateWelcomeEmail,
  generateVerificationEmail,
  generatePasswordResetEmail,
} from "./email";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
    })),
  },
}));

describe("getAppBaseUrl", () => {
  it("returns NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    expect(getAppBaseUrl()).toBe("https://example.com");
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("returns localhost fallback when not set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });
});

describe("generateVerificationEmail", () => {
  it("contains the verification link", () => {
    const html = generateVerificationEmail("John", "https://app.com/verify?token=abc");
    expect(html).toContain("https://app.com/verify?token=abc");
  });

  it("contains the user name", () => {
    const html = generateVerificationEmail("John", "https://app.com/verify");
    expect(html).toContain("Hi John");
  });

  it("mentions expiry", () => {
    const html = generateVerificationEmail("John", "https://app.com/verify");
    expect(html).toContain("1 hour");
  });
});

describe("generatePasswordResetEmail", () => {
  it("contains the reset link", () => {
    const html = generatePasswordResetEmail("John", "https://app.com/reset?token=xyz");
    expect(html).toContain("https://app.com/reset?token=xyz");
  });

  it("contains the user name", () => {
    const html = generatePasswordResetEmail("John", "https://app.com/reset");
    expect(html).toContain("Hi John");
  });

  it("mentions expiry", () => {
    const html = generatePasswordResetEmail("John", "https://app.com/reset");
    expect(html).toContain("1 hour");
  });
});

describe("generateWelcomeEmail", () => {
  it("contains the user name", () => {
    const html = generateWelcomeEmail("Alice");
    expect(html).toContain("Hi Alice");
  });

  it("contains the organization name", () => {
    const html = generateWelcomeEmail("Alice", "MyOrg");
    expect(html).toContain("MyOrg");
  });

  it("defaults org name to HireRight", () => {
    const html = generateWelcomeEmail("Alice");
    expect(html).toContain("HireRight");
  });
});

describe("generateInterviewConfirmationEmail", () => {
  it("contains all interview details", () => {
    const html = generateInterviewConfirmationEmail({
      name: "John",
      date: "2026-01-15",
      time: "10:00",
      mode: "AI Video Interview",
      timezone: "Europe/London",
    });
    expect(html).toContain("Hi John");
    expect(html).toContain("2026-01-15");
    expect(html).toContain("10:00");
    expect(html).toContain("AI Video Interview");
    expect(html).toContain("Europe/London");
  });

  it("defaults timezone to Asia/Kolkata", () => {
    const html = generateInterviewConfirmationEmail({
      name: "John",
      date: "2026-01-15",
      time: "10:00",
      mode: "AI Video Interview",
    });
    expect(html).toContain("Asia/Kolkata");
  });
});

describe("generateReminderEmail", () => {
  it("contains reminder details", () => {
    const html = generateReminderEmail({
      name: "John",
      type: "1 hour",
      date: "2026-01-15",
      time: "10:00",
      message: "Your interview is coming up!",
      timezone: "IST",
    });
    expect(html).toContain("Hi John");
    expect(html).toContain("1 hour");
    expect(html).toContain("Your interview is coming up!");
    expect(html).toContain("2026-01-15");
    expect(html).toContain("10:00");
    expect(html).toContain("IST");
  });
});
