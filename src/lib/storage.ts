import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import * as https from "https";
import * as tls from "tls";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export const isR2Enabled = Boolean(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET_NAME &&
  !R2_ACCOUNT_ID.toLowerCase().includes("your-") &&
  !R2_ACCESS_KEY_ID.toLowerCase().includes("your-")
);

export const STORAGE_MODE = isR2Enabled ? "r2" : "local";

const UPLOADS_ROOT = join(process.cwd(), ".data", "uploads");

let s3Client: S3Client | null = null;

function getS3(): S3Client {
  if (!s3Client) {
    const endpoint = R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    // Create a custom HTTPS agent with TLS 1.2 and broader cipher suite support
    // to fix EPROTO handshake failures with Node.js v24+ / OpenSSL 3.5+
    const httpsAgent = new https.Agent({
      minVersion: "TLSv1.2" as tls.SecureVersion,
      maxVersion: "TLSv1.3" as tls.SecureVersion,
      rejectUnauthorized: true,
      // Allow broader cipher suites for Cloudflare R2 compatibility
      ciphers: undefined, // Use Node.js defaults which include all supported ciphers
    });

    s3Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string,
      },
      requestHandler: {
        httpsAgent,
      } as any,
    });
  }
  return s3Client;
}

function localPathFor(key: string): string {
  return join(UPLOADS_ROOT, key);
}

export async function saveFile(
  key: string,
  data: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  if (isR2Enabled) {
    try {
      await getS3().send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: data,
          ContentType: contentType,
        })
      );
      return;
    } catch (r2Error) {
      console.error("[storage] R2 upload failed, falling back to local storage:", r2Error instanceof Error ? r2Error.message : r2Error);
      // Fall through to local storage
    }
  }
  const filePath = localPathFor(key);
  await mkdir(join(filePath, ".."), { recursive: true });
  await writeFile(filePath, data);
}

export async function getFile(key: string): Promise<Uint8Array | null> {
  if (isR2Enabled) {
    try {
      const result = await getS3().send(
        new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
      );
      const body = result.Body;
      if (!body) return null;
      return await body.transformToByteArray();
    } catch (r2Error) {
      console.error("[storage] R2 fetch failed, falling back to local:", r2Error instanceof Error ? r2Error.message : r2Error);
    }
  }
  try {
    return await readFile(localPathFor(key));
  } catch {
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  if (isR2Enabled) {
    try {
      await getS3().send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
      );
      return;
    } catch (r2Error) {
      console.error("[storage] R2 delete failed, falling back to local:", r2Error instanceof Error ? r2Error.message : r2Error);
    }
  }
  try {
    await unlink(localPathFor(key));
  } catch {
    // Ignore missing files
  }
}

export async function getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string | null> {
  if (!isR2Enabled) return null;
  return getSignedUrl(getS3(), new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string | null> {
  if (!isR2Enabled) return null;
  return getSignedUrl(getS3(), new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}

export function canonicalUrl(key: string): string {
  return `/api/files/${key}`;
}

export function keyFromCanonicalUrl(url: string): string | null {
  const prefix = "/api/files/";
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

export async function resolvePublicUrl(
  url: string | null,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!url) return null;
  const key = keyFromCanonicalUrl(url);
  if (!key) return url;
  const presigned = await getPresignedUrl(key, expiresInSeconds);
  return presigned || url;
}
