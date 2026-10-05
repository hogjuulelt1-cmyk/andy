# CLAUDE.md

Guidance for Claude Code working in this repository.

## What we are building

A mobile-first web app that sells **our own tour packages in Mongolia to young Koreans (20s–30s)**.
Direction is **inbound**: Korea → Mongolia. (An early analysis assumed Mongolians going to Korea; that is wrong, ignore it.)

Core loop:

1. User browses a **standard package** (Gobi 7d, Terelj+Hustai 4d, Khuvsgul 6d) and a departure date.
2. User **joins or opens a group** ("동행" companion matching) so a 6-seat vehicle fills up.
3. User pays an **upfront payment (deposit) that covers the flight cost** to lock their seat.
4. The **remainder is paid in 0% installments** (no interest, no fees), mostly finished **before the trip starts**.
5. We profit from **package margin (15–25%)**, not interest. This is not layaway: the trip is confirmed after the deposit, not after full payment.

Full detail: `docs/product-spec.md`, `docs/business-model.md`, `docs/packages.md`, `docs/risks-and-open-questions.md`.

## Non-negotiable product rules

- **Never charge interest or late-payment interest.** 0% installments only. Anything that looks like lending needs legal review first (see risks doc).
- **Do not build our own credit/lending ledger in v1.** Installments go through a Korean PG (Toss Payments / KG Inicis) card installment (무이자 할부) or a scheduled-charge (billing key) flow, so card issuers carry the credit risk.
- Installment schedule must end **before or during the trip**, never mostly after it.
- All prices are stored in **KRW (integer won)**. Supplier costs in MNT are stored separately with the FX rate used. Never mix currencies in one field.
- User-facing UI language: **Korean** first (ko-KR). Admin/ops UI: English or Mongolian is fine. Keep all strings in i18n files, never hard-coded.
- Prices in docs are **estimates**; seed data is placeholder, not a quote.

## Tech stack (default; change only with a reason written in docs/tech-stack.md)

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- PostgreSQL via Prisma (Supabase or Neon for hosting)
- Auth: Kakao + Naver + email (NextAuth / Auth.js)
- Payments: Toss Payments SDK (sandbox keys in dev)
- Tests: Vitest (unit), Playwright (e2e). Lint: ESLint + Prettier
- Package manager: pnpm

See `docs/tech-stack.md` for the data model and module layout.

## Commands (once the app is scaffolded)

```bash
pnpm install
pnpm dev            # local dev server
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest
pnpm test:e2e       # playwright (Chromium is preinstalled in cloud sessions; do not run `playwright install`)
pnpm prisma migrate dev
pnpm db:seed        # loads seed/packages.json
```

If `package.json` does not exist yet, the first task is scaffolding: follow `docs/roadmap.md` milestone M0.

## Conventions

- Money: `amountKrw: number` (integer). Write helpers in `src/lib/money.ts`; never use floats for money.
- Dates: store UTC, display in Asia/Seoul for users and Asia/Ulaanbaatar for ops.
- Payment status changes only through server-side webhook handlers that verify the PG signature. The client never marks anything paid.
- Every payment/booking state transition is written to an append-only `BookingEvent` table.
- Secrets live in env vars (`.env.local`, never committed). Keep `.env.example` updated.
- Before finishing a change: `pnpm lint && pnpm typecheck && pnpm test`.

## Repo layout note

This app lives in the `travel-bnpl/` subfolder of the `andy` repo (next to the unrelated
Chinbilig Tracker static site). Run every command from inside `travel-bnpl/`; it is its own
pnpm workspace. The folder is excluded from the Chinbilig Vercel deploy via the root
`.vercelignore`; deploy it as a separate Vercel project with Root Directory = `travel-bnpl`.
CI is `.github/workflows/travel-bnpl-ci.yml` at the repo root.

Prisma 7: the generated client is written to `src/generated/prisma` (gitignored; run
`pnpm db:generate` after `pnpm install`), config lives in `prisma.config.ts`, and the client
needs the `@prisma/adapter-pg` driver adapter (see `src/lib/db.ts`).

## Cloud session notes

- `.claude/hooks/session-start.sh` installs dependencies and generates the Prisma client in
  Claude Code cloud sessions. Claude Code only reads hooks from the repo root, so the root
  `.claude/settings.json` must point at `$CLAUDE_PROJECT_DIR/travel-bnpl/.claude/hooks/session-start.sh`
  (the copy in `travel-bnpl/.claude/settings.json` is the reference config).
- No real payment keys in cloud sessions; use Toss sandbox keys from environment secrets.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
