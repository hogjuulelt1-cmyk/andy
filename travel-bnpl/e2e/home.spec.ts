import { test, expect, type Page } from "@playwright/test";

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
}

test("home page renders in Korean at / without horizontal overflow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle(/몽골/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");

  await expectNoOverflow(page);
  expect(errors).toEqual([]);
});

test("/en renders the English version and links back to Korean", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle(/Mongolia/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mongolia");
  await expectNoOverflow(page);

  await page.getByRole("link", { name: "한국어" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
});

test("/ko redirects to /", async ({ page }) => {
  await page.goto("/ko");
  await expect(page).toHaveURL(/\/$/);
});
