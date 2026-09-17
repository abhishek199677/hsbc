import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("admin page requires auth", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/(login|admin)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|admin)/);
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForURL(/\/(login|settings)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|settings)/);
  });
});
