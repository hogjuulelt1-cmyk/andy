# Roadmap

## M0 — Scaffold ✅ (done)

- `pnpm create next-app` (TS, Tailwind, App Router, ESLint), add Prettier, Vitest, Playwright, Prisma.
- Add scripts: `dev, build, lint, typecheck, test, test:e2e, db:seed`.
- `.env.example`, Prisma schema from `docs/tech-stack.md`, seed from `seed/packages.json`.
- CI: GitHub Actions running lint, typecheck, test.

## M1 — Browse ✅ (done; data from seed/*.json until DATABASE_URL exists, see src/server/catalog.ts)

- Package list + detail page (Korean), itinerary per day, price range.
- Departures calendar with seat fill (e.g. 4/6).

## M2 — Join + deposit (in progress)

- Kakao/Naver login, profile (name as in passport, gender, age range, intro).
- Join a departure → Toss Payments checkout for the deposit → server confirm + webhook → seat held.
- Remainder due date (≥7 days before departure) shown on the booking; paid via a second Toss checkout (card 무이자 할부 available there). ✅ date logic in `src/lib/installments.ts`; join page at /departures/[id]/join.
- Reminder emails before the remainder due date.

## M3 — Matching + group (core product)

- Group page per departure: members (first name + intro), seat fill, confirmed/open status, countdown.
- Group chat (Supabase Realtime or polling), checklist (passport, eSIM, insurance).
- Matching helpers: filter departures by date range, gender mix, age range; "open a new departure" request when none fits.
- Auto-confirm at cutoff (minToConfirm reached) and cancel/refund path when not.

## M4 — Admin

- Package/departure CRUD, payment status board, overdue list, supplier costs → margin report.
- Confirm/cancel departure + refunds.

## M5 — Launch prep

- Legal terms (ko), refund policy, privacy policy.
- Real supplier prices, real Toss keys, analytics.
