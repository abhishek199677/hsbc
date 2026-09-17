import { test, expect } from "@playwright/test";

test.describe("Interview Flow", () => {
  test("interview page requires auth", async ({ page }) => {
    await page.goto("/interview");
    // Should redirect to login or show auth error
    await page.waitForURL(/\/(login|interview)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|interview)/);
  });

  test("interview room requires auth", async ({ page }) => {
    await page.goto("/interview/room");
    await page.waitForURL(/\/(login|interview)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|interview)/);
  });

  test("confirmation page requires auth", async ({ page }) => {
    await page.goto("/confirmation");
    // Should redirect to login or show content
    await page.waitForURL(/\/(login|confirmation)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|confirmation)/);
  });
});
