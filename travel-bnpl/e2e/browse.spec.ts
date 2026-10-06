import { test, expect, type Page } from "@playwright/test";

async function expectClean(page: Page, errors: string[]) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
}

test("packages list → detail → departures, in Korean", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/packages");
  await expect(page.getByRole("heading", { level: 1, name: "패키지" })).toBeVisible();
  const cards = page.getByRole("link", { name: /고비 사막 7일/ });
  await expect(cards).toHaveCount(1);
  await expectClean(page, errors);

  await cards.click();
  await expect(page).toHaveURL(/\/packages\/gobi-7d$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("고비 사막 7일");
  await expect(page.getByRole("heading", { name: "일정" })).toBeVisible();
  await expect(page.getByText("1일차")).toBeVisible();
  await expect(page.getByRole("heading", { name: "출발일" })).toBeVisible();
  // Seat fill like "4/6명" and a full departure labelled 마감.
  await expect(page.getByText("4/6명")).toBeVisible();
  await expect(page.getByText("마감").first()).toBeVisible();
  await expectClean(page, errors);
});

test("English detail page uses English itinerary and dates", async ({ page }) => {
  await page.goto("/en/packages/khuvsgul-6d");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Khuvsgul 6 days");
  await expect(page.getByText("Day 1")).toBeVisible();
  await expect(page.getByText("Fly to Murun, drive to Khatgal")).toBeVisible();
  await expect(page.getByText("June 2027")).toBeVisible();
});

test("unknown package is a 404", async ({ page }) => {
  const res = await page.goto("/packages/nope");
  expect(res?.status()).toBe(404);
});
