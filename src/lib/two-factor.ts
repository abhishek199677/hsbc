import speakeasy from "speakeasy";
import QRCode from "qrcode";

export function generateTwoFactorSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `TechCitta (${email})`,
    issuer: "TechCitta",
    length: 20,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url!,
  };
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}

export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}
