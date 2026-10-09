import { describe, expect, it } from "vitest";
import { getLiveKitUrl, isLiveAvatarConfigured } from "./livekit-config";

describe("getLiveKitUrl", () => {
  it("uses the configured LiveKit URL", () => {
    expect(getLiveKitUrl("wss://custom.livekit.cloud")).toBe(
      "wss://custom.livekit.cloud"
    );
  });

  it("uses the same project URL when no URL is configured", () => {
    expect(getLiveKitUrl("")).toBe("wss://techcitta-b5zx3t8p.livekit.cloud");
    expect(getLiveKitUrl(undefined)).toBe("wss://techcitta-b5zx3t8p.livekit.cloud");
  });
});

describe("isLiveAvatarConfigured", () => {
  it("requires both the provider API key and a selected face", () => {
    expect(isLiveAvatarConfigured("simli-key", "simli-face")).toBe(true);
    expect(isLiveAvatarConfigured("simli-key", "")).toBe(false);
    expect(isLiveAvatarConfigured("", "simli-face")).toBe(false);
    expect(isLiveAvatarConfigured(undefined, undefined)).toBe(false);
    expect(isLiveAvatarConfigured(" ", "simli-face")).toBe(false);
  });
});
