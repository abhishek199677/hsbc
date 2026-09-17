const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
] as const;

const optionalEnvVars = [
  "OPENAI_API_KEY",
  "CORS_ALLOWED_ORIGINS",
  "LIVEKIT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "DEEPGRAM_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGN_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SENTRY_DSN",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_MODE",
  "NEXT_PUBLIC_APP_URL",
] as const;

let validated = false;

export function validateEnv() {
  if (validated) return;

  const missing: string[] = [];
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      `Copy .env.example to .env and fill in the required values.`
    );
  }

  // Warn about missing optional vars
  const missingOptional: string[] = [];
  for (const key of optionalEnvVars) {
    if (!process.env[key]) {
      missingOptional.push(key);
    }
  }
  if (missingOptional.length > 0) {
    console.warn(
      `[env] Missing optional environment variables: ${missingOptional.join(", ")}. ` +
      `Some features may be unavailable.`
    );
  }

  validated = true;
}
