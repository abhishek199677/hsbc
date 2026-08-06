import { describe, it, expect } from "vitest";
import { isValidEmail, isValidPassword } from "@/lib/security";

describe("isValidEmail", () => {
  it("accepts normal emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("a.b+c@sub.domain.co")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("plainaddress")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user name@domain.com")).toBe(false);
    expect(isValidEmail("a".repeat(250) + "@example.com")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("accepts 8-128 char passwords", () => {
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("x".repeat(128))).toBe(true);
  });

  it("rejects too short or too long", () => {
    expect(isValidPassword("short")).toBe(false);
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("x".repeat(129))).toBe(false);
  });
});
