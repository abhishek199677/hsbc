import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  sanitizeString,
  isNotEmpty,
  containsOnlyAllowedChars,
  escapeHtml,
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
  it("accepts passwords with 12+ chars, uppercase, lowercase, number, and special char", () => {
    expect(isValidPassword("Password123!")).toBe(true);
    expect(isValidPassword("ABCdef123456!")).toBe(true);
    expect(isValidPassword("Secure@123456")).toBe(true);
  });

  it("rejects passwords without uppercase", () => {
    expect(isValidPassword("password1234")).toBe(false);
  });

  it("rejects passwords without number", () => {
    expect(isValidPassword("Password123")).toBe(false);
  });

  it("rejects passwords shorter than 12 characters", () => {
    expect(isValidPassword("Pass1")).toBe(false);
    expect(isValidPassword("abc")).toBe(false);
    expect(isValidPassword("")).toBe(false);
    expect(isValidPassword("Abcdef12")).toBe(false);
  });

  it("rejects passwords longer than 128 characters", () => {
    expect(isValidPassword("A1a!" + "a".repeat(127))).toBe(false);
  });

  it("accepts passwords exactly 12 and 128 characters", () => {
    expect(isValidPassword("Abcdef12!@#$")).toBe(true);
    expect(isValidPassword("A1" + "a".repeat(124) + "!")).toBe(true);
  });
});

describe("sanitizeString", () => {
  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("escapes HTML special characters", () => {
    expect(sanitizeString("  <script>  ")).toBe("&lt;script&gt;");
    expect(sanitizeString('  He said "hello"  ')).toBe("He said &quot;hello&quot;");
    expect(sanitizeString("  Tom & Jerry  ")).toBe("Tom &amp; Jerry");
    expect(sanitizeString("  it's  ")).toBe("it&#39;s");
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

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
    );
    expect(escapeHtml('quote "test"')).toBe("quote &quot;test&quot;");
    expect(escapeHtml("ampersand & entity")).toBe("ampersand &amp; entity");
    expect(escapeHtml("angle < brackets")).toBe("angle &lt; brackets");
  });

  it("handles null and undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml("")).toBe("");
  });

  it("passes through safe strings unchanged", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
    expect(escapeHtml("user@example.com")).toBe("user@example.com");
    expect(escapeHtml("12345")).toBe("12345");
  });
});
