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
});
