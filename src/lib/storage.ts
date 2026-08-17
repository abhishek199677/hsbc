import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export const isR2Enabled = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME
);

export const STORAGE_MODE = isR2Enabled ? "r2" : "local";

const UPLOADS_ROOT = join(process.cwd(), ".data", "uploads");

let s3Client: S3Client | null = null;

function getS3(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string,
      },
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
    await getS3().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );
    return;
  }
  const filePath = localPathFor(key);
  await mkdir(join(filePath, ".."), { recursive: true });
  await writeFile(filePath, data);
}

export async function getFile(key: string): Promise<Uint8Array | null> {  if (isR2Enabled) {
    const result = await getS3().send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
    );
    const body = result.Body;
    if (!body) return null;
    return await body.transformToByteArray();
  }
  try {
    return await readFile(localPathFor(key));
  } catch {
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  if (isR2Enabled) {
    await getS3().send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
    );
    return;
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
