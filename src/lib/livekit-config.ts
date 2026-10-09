const DEFAULT_LIVEKIT_URL = "wss://techcitta-b5zx3t8p.livekit.cloud";

export function getLiveKitUrl(configuredUrl: string | undefined = process.env.LIVEKIT_URL): string {
  return configuredUrl || DEFAULT_LIVEKIT_URL;
}

export function isLiveAvatarConfigured(
  apiKey: string | undefined = process.env.SIMLI_API_KEY,
  faceId: string | undefined = process.env.SIMLI_FACE_ID
): boolean {
  return Boolean(apiKey?.trim() && faceId?.trim());
}
