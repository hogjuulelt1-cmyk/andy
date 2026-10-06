# 몽글 (Monggle) — Project status

Updated 2026-10-06. One-page summary for anyone (or any Claude chat) picking this up.
Code lives in the `andy` repo, folder `travel-bnpl/`, branch `claude/travel-bnpl`.

- Clickable demo (private, share from the page's Share menu): https://claude.ai/artifact/NPyd6LSYbr397jnBnm8sPq
- Code: https://github.com/hogjuulelt1-cmyk/andy/tree/claude/travel-bnpl/travel-bnpl
- Detail docs: `CLAUDE.md`, `docs/product-spec.md`, `docs/business-model.md`, `docs/packages.md`, `docs/tech-stack.md`, `docs/risks-and-open-questions.md`, `docs/roadmap.md`

## What it is

A mobile-first web app that sells **our own Mongolia tour packages to Koreans in their 20s–30s** (inbound, Korea → Mongolia).
Brand: **몽글 / Monggle**, tagline "몽골, 같이 가자".

Core loop: pick a package → join a companion (동행) group for a departure date → pay the **flight-portion deposit via Toss** to lock the seat → pay the **remainder via Toss** by 7 days before departure (card 무이자 할부 available at Toss) → group chat / checklist → go.

## Decisions so far

| Date       | Decision                                                                                                                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-30 | Not layaway: the seat is confirmed on the deposit, not on full payment. Deposit = flight cost. No interest, no fees. We profit from package margin (15–25%).                                                                                    |
| 2026-10-06 | **All money moves through Toss Payments.** We never charge cards or run our own installment plan; 무이자 할부 is the user's choice at Toss checkout and carried by the card issuer.                                                             |
| 2026-10-06 | **Our product is companion matching + itineraries**, not payment mechanics. "0% installments" alone is not a differentiator in Korea (card 무이자 할부, Toss/Kakao/Naver 후불결제 already exist).                                               |
| 2026-10-06 | Korean users paying a Mongolian merchant directly is not viable (no 무이자 할부, no 간편결제, trust). A Toss merchant needs a Korean 사업자등록번호 → start with a **Korean 여행사 partner (랜드사 model)**, move to our own Korean 법인 later. |
| 2026-10-06 | Packages and prices rebuilt from Korean-market research (see below).                                                                                                                                                                            |

## Packages (per person, KRW, incl. flight; 2026 estimates, not quotes)

| Package                             | Days | Price       | Deposit (flight) | Note                                          |
| ----------------------------------- | ---- | ----------- | ---------------- | --------------------------------------------- |
| 고비 + 중부 8박 9일                 | 9    | 209만–239만 | 55만–70만        | Route Korean companion groups form most often |
| 남고비 6박 7일                      | 7    | 169만–189만 | 55만–70만        | Stars at Bayanzag                             |
| 중부 미니고비 + 쳉헤르 온천 5박 6일 | 6    | 139만–159만 | 55만–70만        | Popular with 20s–30s                          |
| 테를지 + 후스타이 3박 4일           | 4    | 89만–109만  | 49만–65만        | Short break, all year                         |
| 흡스굴 호수 5박 6일                 | 6    | 159만–189만 | 60만–75만        | Jun–Aug, domestic flight                      |

Anchors: Korean agencies price 남고비 6박7일 at ~180만 incl. flight (항공 ~60만 + 투어 ~110만); ICN–ULN return 49만–65만, peak ~65만 (MIAT, Jeju Air). Each itinerary day is tied to a real place with coordinates (`seed/places.json`), drawn on a route map.

## What is built (demo, no database or real keys)

Everything below works end to end in the demo link and in the Next.js app:

- Package list, detail (illustration, highlights, price block, **route map**, day-by-day itinerary with place thumbnails, included items), departures grouped by month with seat fill (●●○○○○ 2/6명), status (모집 중 / 출발 확정 / 마감), "4명 모이면 출발 확정".
- **동행 찾기 (matching)**: 7 questions (여행 속도, 음식 — 한식 필요?, 술, 아침형/저녁형, 사진, 숙소, 성별 구성) + optional MBTI. Ranks all joinable departures by fit with members who already joined, shows per-member %, "잘 맞는 점", same-gender warning. Group page shows "나와 N% 맞음" per member.
- Mock login (Kakao/Naver-styled, name only), join → **Toss-styled checkout** (카드 / 토스페이 / 카카오페이 / 네이버페이, 무이자 할부 months for the remainder) → 내 여행 (status, remainder due date, pay remainder, cancel) → 동행 그룹 (members, D-day, chat, checklist).
- Korean (default, at `/`) and English (`/en`); Mongolian strings exist for admin use.
- Illustrations are stylised SVG (dunes, canyon, cliffs, steppe, horses, lake, stars, city, hot spring, monastery, rocks) because the demo cannot load external images. Swap for real photos in the Next.js app when we have licensed ones.

Tech: Next.js 16 (App Router, TS strict, Tailwind 4), Prisma 7 schema ready (not connected), Vitest (35 unit tests), Playwright e2e on iPhone 13 (12 tests), GitHub Actions CI. Demo state (login, bookings, profile, chat) lives in cookies / localStorage; `src/server/session.ts`, `actions.ts`, `catalog.ts` are the three files to replace when the real backend lands. `pnpm preview` rebuilds the single-file demo.

## Not built yet / needs input

| Item                                                                                    | Needs                                                                                                                                        |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Real database (bookings, users, groups, chat)                                           | `DATABASE_URL` (Supabase/Neon); schema + seed are ready                                                                                      |
| Real login                                                                              | Kakao / Naver OAuth keys (Auth.js)                                                                                                           |
| Real Toss Payments                                                                      | Toss merchant (Korean entity or partner) + sandbox keys; checkout UI already mirrors the widget                                              |
| Live URL                                                                                | Vercel project with Root Directory `travel-bnpl`, or a `VERCEL_TOKEN` in the cloud environment                                               |
| Photos                                                                                  | Licensed Mongolia photos                                                                                                                     |
| Admin (packages/departures CRUD, payments board, supplier costs in MNT → margin report) | Database first                                                                                                                               |
| Reminders (remainder due, group confirmed)                                              | Email first, KakaoTalk 알림톡 later                                                                                                          |
| Legal pages (이용약관, 환불규정, 개인정보처리방침)                                      | Lawyer review; Korean 여행업 registration via partner                                                                                        |
| Matching weights                                                                        | Current weights are a guess (`src/lib/matching.ts`, `W`): pace 3, food 2, wake 2, MBTI 2, drink 1, photo 1, budget 1. Tune with real groups. |

## Open questions for Anthony

- Korean entity: partner 여행사 (랜드사 contract) or our own 외국인투자법인? Who holds the Toss merchant?
- Minimum group size (now 4 of 6) and cutoff days (now 14) to confirm a departure.
- Deposit percentage per package and the refund policy.
- Which suppliers (vehicles, camps, Korean-speaking guides) are already lined up?
- Keep the name 몽글?
