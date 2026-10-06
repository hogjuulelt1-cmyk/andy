import { test, expect } from "@playwright/test";

test("questionnaire → ranked departures → per-member match on the group page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/match");
  await expect(page.getByRole("heading", { level: 1, name: "나와 맞는 동행 찾기" })).toBeVisible();
  await page.getByText("느긋하게 쉬엄쉬엄").click();
  await page.getByText("한식 꼭 필요").click();
  await page.getByText("안 마셔요").click();
  await page.getByText("일출 보러 일찍").click();
  await page.getByText("여성", { exact: true }).click();
  await page.getByLabel(/MBTI/).fill("isfj");
  await page.getByRole("button", { name: "맞는 그룹 보기" }).click();

  await expect(page).toHaveURL(/\/match\?saved=1$/);
  await expect(page.getByRole("status")).toContainText("저장");
  await expect(page.getByText("ISFJ", { exact: true }).first()).toBeVisible();
  const items = page.locator("ol > li");
  await expect(items.first()).toContainText(/\d+% 맞음|첫 멤버 되기/);
  // Ranked: first scored item >= second scored item.
  const scores = await items.locator("span", { hasText: /% 맞음/ }).allTextContents();
  const nums = scores.map((s) => Number(s.replace(/\D/g, "")));
  expect(nums.length).toBeGreaterThan(2);
  expect(nums[0]).toBeGreaterThanOrEqual(nums[1]);

  // Group page shows a per-member badge now that a profile exists.
  await page.goto("/departures/gobi-2027-06-19/group");
  await expect(page.getByText(/나와 \d+% 맞음/).first()).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});
