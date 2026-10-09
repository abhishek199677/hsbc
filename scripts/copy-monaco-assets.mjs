import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MONACO_VS_PUBLIC_PATH = "monaco/vs";

/**
 * @param {string} sourceDirectory
 * @param {string} publicDirectory
 */
export async function copyMonacoAssets(sourceDirectory, publicDirectory) {
  const destination = path.join(publicDirectory, MONACO_VS_PUBLIC_PATH);
  await mkdir(destination, { recursive: true });
  await cp(sourceDirectory, destination, { recursive: true, force: true });
}

async function main() {
  const require = createRequire(import.meta.url);
  const monacoPackage = require.resolve("monaco-editor/package.json");
  const sourceDirectory = path.join(path.dirname(monacoPackage), "min", "vs");
  await copyMonacoAssets(sourceDirectory, path.resolve("public"));

  const standaloneDirectory = path.resolve(".next/standalone");
  if (existsSync(standaloneDirectory)) {
    await copyMonacoAssets(sourceDirectory, path.join(standaloneDirectory, "public"));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
