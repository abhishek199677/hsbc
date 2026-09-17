import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    // Page should render without error - check for common landing elements
    await expect(page.locator("body")).toBeVisible();
  });

  test("signup page loads with form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[name='email']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("input[name='password']")).toBeVisible();
    await expect(page.locator("input[name='confirmPassword']")).toBeVisible();
  });

  test("login page loads with form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[name='email']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("input[name='password']")).toBeVisible();
  });

  test("pricing page loads with plan tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Starter" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enterprise" })).toBeVisible();
  });

  test("signup rejects weak password", async ({ page }) => {
    await page.goto("/signup");
    await page.locator("input[name='password']").fill("weak");
    await page.locator("input[name='confirmPassword']").fill("weak");
    await page.locator("button[type='submit']").click();
    // Should stay on signup page or show error
    await expect(page).toHaveURL(/signup/);
  });
});
