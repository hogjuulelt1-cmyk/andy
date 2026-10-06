import { test, expect } from "@playwright/test";

test("full demo flow: login → join → mock Toss deposit → my trips → group → remainder", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // Join needs login.
  await page.goto("/departures/gobi-2027-05-29/join");
  await page.getByRole("link", { name: "로그인하고 참여하기" }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel(/이름/).fill("테스트");
  await page.getByRole("button", { name: "카카오로 시작하기" }).click();

  // Back on the join page, now with the pay button.
  await expect(page).toHaveURL(/\/departures\/gobi-2027-05-29\/join$/);
  await page.getByRole("button", { name: /토스로 예약금 결제/ }).click();

  // Mock Toss checkout for the deposit.
  await expect(page).toHaveURL(/\/pay\/bk_\w+\?type=deposit$/);
  await expect(page.getByText("toss payments")).toBeVisible();
  await expect(page.getByText("550,000원").first()).toBeVisible();
  await page.getByText("카카오페이").click();
  await page.getByRole("button", { name: /결제하기/ }).click();

  // My trips: seat held, remainder due.
  await expect(page).toHaveURL(/\/my\?paid=/);
  await expect(page.getByRole("status")).toContainText("좌석이 확정");
  await expect(page.getByText("좌석 확정 · 잔금 남음")).toBeVisible();
  await expect(page.getByText(/잔금 1,140,000원 · .*까지/)).toBeVisible();

  // Group page shows me as a member with chat + checklist.
  await page.getByRole("link", { name: "동행 그룹" }).click();
  await expect(page).toHaveURL(/\/departures\/gobi-2027-05-29\/group$/);
  await expect(page.getByText("테스트(나)")).toBeVisible();
  await expect(page.getByText("3/6명 · 3자리 남음")).toBeVisible();
  await page.getByLabel("메시지 입력").fill("안녕하세요");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText("안녕하세요").last()).toBeVisible();
  await page.getByLabel("여권 유효기간 6개월 이상 확인").check();
  await expect(page.getByText("1/6")).toBeVisible();

  // Pay the remainder with card 3개월 무이자.
  await page.goto("/my");
  await page.getByRole("link", { name: "잔금 결제" }).click();
  await expect(page.getByText("1,140,000원").first()).toBeVisible();
  await page.getByLabel("할부").selectOption("3");
  await page.getByRole("button", { name: /결제하기/ }).click();
  await expect(page.getByText("결제 완료")).toBeVisible();
  await expect(page.getByText("카드 3개월 무이자")).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test("cancelling at checkout removes the pending booking", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/이름/).fill("취소");
  await page.getByRole("button", { name: "네이버로 시작하기" }).click();
  await expect(page).toHaveURL(/\/my$/);
  await page.goto("/departures/terelj-2027-04-30/join");
  await page.getByRole("button", { name: /토스로 예약금 결제/ }).click();
  await expect(page).toHaveURL(/\/pay\//);
  await page.getByRole("button", { name: "취소" }).click();
  await expect(page).toHaveURL(/\/departures\/terelj-2027-04-30\/join$/);
  await page.goto("/my");
  await expect(page.getByText("아직 참여한 여행이 없습니다.")).toBeVisible();
});
