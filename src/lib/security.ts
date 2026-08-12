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
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be less than 128 characters");

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

// --- String Sanitization ---

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>'"&]/g, (char) => {
    switch (char) {
      case "<":
        return "<";
      case ">":
        return ">";
      case "'":
        return "'";
      case '"':
        return '"';
      case "&":
        return "&";
      default:
        return char;
    }
  });
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