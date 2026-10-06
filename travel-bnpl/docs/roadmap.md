# Roadmap

## M0 — Scaffold ✅ (done)

- `pnpm create next-app` (TS, Tailwind, App Router, ESLint), add Prettier, Vitest, Playwright, Prisma.
- Add scripts: `dev, build, lint, typecheck, test, test:e2e, db:seed`.
- `.env.example`, Prisma schema from `docs/tech-stack.md`, seed from `seed/packages.json`.
- CI: GitHub Actions running lint, typecheck, test.

## M1 — Browse ✅ (done; data from seed/*.json until DATABASE_URL exists, see src/server/catalog.ts)

- Package list + detail page (Korean), itinerary per day, price range.
- Departures calendar with seat fill (e.g. 4/6).

## M2 — Join + deposit

- Kakao/Naver login, profile.
- Join a departure → Toss sandbox payment for deposit → webhook → seat held.
- `buildInstallmentSchedule` + tests.

## M3 — Installments + group

- Scheduled installment charges (billing key) or card 무이자 할부 option.
- Group page with members, chat, checklist, countdown.
- Reminder notifications (email; KakaoTalk Alimtalk later).

## M4 — Admin

- Package/departure CRUD, payment status board, overdue list, supplier costs → margin report.
- Confirm/cancel departure + refunds.

## M5 — Launch prep

- Legal terms (ko), refund policy, privacy policy.
- Real supplier prices, real Toss keys, analytics.
