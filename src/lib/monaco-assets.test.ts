import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { copyMonacoAssets, MONACO_VS_PUBLIC_PATH } from "../../scripts/copy-monaco-assets.mjs";

describe("copyMonacoAssets", () => {
  let tempDirectory: string;

  afterEach(async () => {
    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true });
      tempDirectory = "";
    }
  });

  it("copies Monaco's AMD loader files into the local public asset path", async () => {
    tempDirectory = await mkdtemp(path.join(tmpdir(), "monaco-assets-"));
    const sourceDirectory = path.join(tempDirectory, "source");
    const publicDirectory = path.join(tempDirectory, "public");
    const loaderContents = "self.require = {};";
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(path.join(sourceDirectory, "loader.js"), loaderContents);

    await copyMonacoAssets(sourceDirectory, publicDirectory);

    expect(MONACO_VS_PUBLIC_PATH).toBe("monaco/vs");
    await expect(
      readFile(path.join(publicDirectory, MONACO_VS_PUBLIC_PATH, "loader.js"), "utf8")
    ).resolves.toBe(loaderContents);
  });
});
