import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  sanitizeString,
  isNotEmpty,
  containsOnlyAllowedChars,
} from "./security";

describe("isValidEmail", () => {
  it("accepts valid email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user@domain.co.uk")).toBe(true);
    expect(isValidEmail("name+tag@example.org")).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("accepts passwords with 8 or more characters", () => {
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("abcdefgh")).toBe(true);
    expect(isValidPassword("longpassword123!")).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("abc")).toBe(false);
    expect(isValidPassword("")).toBe(false);
  });

  it("rejects passwords longer than 128 characters", () => {
    expect(isValidPassword("a".repeat(129))).toBe(false);
  });

  it("accepts passwords exactly 8 and 128 characters", () => {
    expect(isValidPassword("a".repeat(8))).toBe(true);
    expect(isValidPassword("a".repeat(128))).toBe(true);
  });
});

describe("sanitizeString", () => {
  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("trims strings with special characters", () => {
    expect(sanitizeString("  <script>  ")).toBe("<script>");
    expect(sanitizeString('  He said "hello"  ')).toBe('He said "hello"');
    expect(sanitizeString("  Tom & Jerry  ")).toBe("Tom & Jerry");
    expect(sanitizeString("  it's  ")).toBe("it's");
  });

  it("handles empty string", () => {
    expect(sanitizeString("")).toBe("");
  });

  it("does not modify safe strings", () => {
    expect(sanitizeString("Hello World 123")).toBe("Hello World 123");
  });
});

describe("isNotEmpty", () => {
  it("returns true for non-empty strings", () => {
    expect(isNotEmpty("hello")).toBe(true);
    expect(isNotEmpty("  hello  ")).toBe(true);
  });

  it("returns false for empty or whitespace-only strings", () => {
    expect(isNotEmpty("")).toBe(false);
    expect(isNotEmpty("   ")).toBe(false);
    expect(isNotEmpty("\t\n")).toBe(false);
  });
});

describe("containsOnlyAllowedChars", () => {
  it("returns true when all chars match the pattern", () => {
    expect(containsOnlyAllowedChars("hello", /^[a-z]+$/)).toBe(true);
    expect(containsOnlyAllowedChars("123", /^\d+$/)).toBe(true);
  });

  it("returns false when chars do not match the pattern", () => {
    expect(containsOnlyAllowedChars("Hello", /^[a-z]+$/)).toBe(false);
    expect(containsOnlyAllowedChars("abc123", /^[a-z]+$/)).toBe(false);
  });

  it("works with different regex patterns", () => {
    expect(containsOnlyAllowedChars("abc-123", /^[a-z0-9-]+$/)).toBe(true);
    expect(containsOnlyAllowedChars("abc 123", /^[a-z0-9-]+$/)).toBe(false);
  });
});
