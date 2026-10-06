import { test, expect } from "@playwright/test";

test("open departure → join page shows deposit and the remainder due date", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/packages/gobi-7d");
  await page.getByRole("link", { name: "참여하기" }).first().click();
  await expect(page).toHaveURL(/\/departures\/gobi-2027-05-29\/join$/);
  await expect(page.getByRole("heading", { level: 1, name: "참여하기" })).toBeVisible();
  await expect(page.getByText("550,000원").first()).toBeVisible(); // deposit
  await expect(page.getByRole("heading", { name: "잔금 결제" })).toBeVisible();
  await expect(page.getByText("잔금 결제 기한")).toBeVisible();
  await expect(page.getByText("토스페이먼츠로 결제합니다", { exact: false })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test("full departure has no join link and its join page says so", async ({ page }) => {
  await page.goto("/en/packages/gobi-7d");
  const fullCard = page.locator("li", { hasText: "Jul 10" }).first();
  await expect(fullCard.getByRole("link", { name: "Join" })).toHaveCount(0);

  await page.goto("/en/departures/gobi-2027-07-10/join");
  await expect(page.getByRole("status")).toContainText("cannot be joined");
});

test("unknown departure is a 404", async ({ page }) => {
  const res = await page.goto("/departures/nope/join");
  expect(res?.status()).toBe(404);
});
