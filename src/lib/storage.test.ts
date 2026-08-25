import { describe, it, expect } from "vitest";
import {
  canonicalUrl,
  keyFromCanonicalUrl,
  isR2Enabled,
  STORAGE_MODE,
} from "./storage";

describe("canonicalUrl", () => {
  it("prefixes with /api/files/", () => {
    expect(canonicalUrl("video/interview-123.webm")).toBe("/api/files/video/interview-123.webm");
  });

  it("handles nested keys", () => {
    expect(canonicalUrl("a/b/c/file.txt")).toBe("/api/files/a/b/c/file.txt");
  });

  it("handles empty key", () => {
    expect(canonicalUrl("")).toBe("/api/files/");
  });
});

describe("keyFromCanonicalUrl", () => {
  it("extracts key from canonical URL", () => {
    expect(keyFromCanonicalUrl("/api/files/video/interview-123.webm")).toBe("video/interview-123.webm");
  });

  it("returns null for non-canonical URLs", () => {
    expect(keyFromCanonicalUrl("/other/path/file.txt")).toBeNull();
    expect(keyFromCanonicalUrl("https://example.com/api/files/file.txt")).toBeNull();
  });

  it("handles empty string", () => {
    expect(keyFromCanonicalUrl("")).toBeNull();
  });

  it("extracts key with nested paths", () => {
    expect(keyFromCanonicalUrl("/api/files/a/b/c/file.txt")).toBe("a/b/c/file.txt");
  });
});

describe("storage configuration", () => {
  it("isR2Enabled is a boolean", () => {
    expect(typeof isR2Enabled).toBe("boolean");
  });

  it("STORAGE_MODE is either r2 or local", () => {
    expect(["r2", "local"]).toContain(STORAGE_MODE);
  });

  it("STORAGE_MODE matches isR2Enabled", () => {
    if (isR2Enabled) {
      expect(STORAGE_MODE).toBe("r2");
    } else {
      expect(STORAGE_MODE).toBe("local");
    }
  });
});
