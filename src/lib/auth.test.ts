import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@/lib/auth";

describe("authentication cookies", () => {
  it("SESSION_COOKIE has correct name", () => {
    expect(SESSION_COOKIE).toBe("techcitta_session");
  });

  it("cookie header can be parsed", () => {
    const token = "test-token-123";
    const cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}`;
    const match = cookie
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${SESSION_COOKIE}=`));

    expect(match).toBeDefined();
    expect(decodeURIComponent(match!.slice(SESSION_COOKIE.length + 1))).toBe(token);
  });

  it("handles multiple cookies in header", () => {
    const token = "my-session-token";
    const cookie = `other_cookie=value; ${SESSION_COOKIE}=${encodeURIComponent(token)}; another=value`;
    const match = cookie
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${SESSION_COOKIE}=`));

    expect(match).toBeDefined();
    expect(decodeURIComponent(match!.slice(SESSION_COOKIE.length + 1))).toBe(token);
  });

  it("returns undefined when cookie not present", () => {
    const cookie = "other_cookie=value; another=value";
    const match = cookie
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${SESSION_COOKIE}=`));

    expect(match).toBeUndefined();
  });
});

describe("AuthUser interface", () => {
  it("defines expected fields", () => {
    // Type-level check: ensure AuthUser has the expected shape
    const user: import("@/lib/auth").AuthUser = {
      sessionId: "session-123",
      userId: "user-456",
      email: "test@example.com",
      organizationId: "org-789",
    };

    expect(user.sessionId).toBe("session-123");
    expect(user.userId).toBe("user-456");
    expect(user.email).toBe("test@example.com");
    expect(user.organizationId).toBe("org-789");
  });
});
