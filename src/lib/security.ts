/**
 * Security validation utilities for user input.
 * Used for signup, login, and form validation.
 */

import { z } from "zod";

// --- Email Validation ---

const emailSchema = z.string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

// --- Password Validation ---

const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters long")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

// --- String Sanitization ---

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>'"&]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "'":
        return "&#39;";
      case '"':
        return "&quot;";
      case "&":
        return "&amp;";
      default:
        return char;
    }
  });
}

/**
 * Escape HTML entities for safe interpolation into HTML templates.
 * Use this whenever user-provided values are inserted into HTML emails or pages.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- Validation Helpers ---

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function containsOnlyAllowedChars(
  input: string,
  allowed: RegExp
): boolean {
  return allowed.test(input);
}