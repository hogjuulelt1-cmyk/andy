# Tech stack and architecture

## Stack

| Layer          | Choice                                                               | Why                                                   |
| -------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| Frontend + API | Next.js (App Router), TypeScript strict                              | One codebase, SSR for SEO (Naver/Google), easy deploy |
| Styling        | Tailwind CSS                                                         | Fast mobile-first UI                                  |
| DB             | PostgreSQL + Prisma                                                  | Relational data (bookings, payments)                  |
| Hosting        | Vercel + Supabase/Neon                                               | Low ops                                               |
| Auth           | Auth.js with Kakao, Naver, email                                     | Koreans expect Kakao/Naver login                      |
| Payments       | Toss Payments (card, 무이자 할부, billing key for scheduled charges) | Korean standard                                       |
| Chat           | Supabase Realtime or simple polling in v1                            | Group chat                                            |
| i18n           | next-intl, `ko` default, `en`, `mn` for admin                        |                                                       |
| Tests          | Vitest, Playwright                                                   |                                                       |

## Suggested layout

```
src/
  app/(public)/          # package list, detail, departures
  app/(user)/            # my trips, group page, payments
  app/admin/             # ops dashboard
  app/api/webhooks/toss/ # payment webhooks (verify signature)
  lib/money.ts           # KRW integer helpers
  lib/installments.ts    # schedule calculation (pure, unit-tested)
  lib/payments/          # Toss client wrapper
  server/                # domain services
prisma/schema.prisma
seed/packages.json
messages/{ko,en,mn}.json
```

## Data model (first draft)

- **User**: id, name, nameEn (passport), email, phone, gender, birthYear, intro, provider (kakao/naver/email)
- **Package**: id, slug, title{ko,en,mn}, days, nights, season, basePriceKrw, depositKrw (flight portion), description, itinerary (PackageDay[])
- **PackageDay**: packageId, dayNumber, title, description, stay
- **Departure**: id, packageId, startDate, endDate, capacity (6), minToConfirm (4), priceKrw, depositKrw, status (open | confirmed | full | cancelled | completed), confirmCutoffDate
- **Booking**: id, userId, departureId, status (pending_deposit | seat_held | paid_in_full | cancelled | refunded), totalKrw, depositKrw
- **InstallmentPlan / Installment**: bookingId, seq, dueDate, amountKrw, status (scheduled | paid | failed | waived)
- **Payment**: id, bookingId, installmentId?, provider, providerPaymentKey, amountKrw, status, rawWebhook
- **BookingEvent**: append-only audit log of every state change
- **AddOn / BookingAddOn**
- **Supplier / DepartureCost**: costMnt, fxRate, costKrw (for margin report)
- **ChatMessage**: departureId, userId, body, createdAt

## Key business logic

- `buildInstallmentSchedule(total, deposit, bookingDate, departureDate, maxInstallments)`:
  remainder split into ≤4 monthly charges, last due ≥7 days before departure; if not enough time, fewer installments or pay-in-full. Pure function, heavily unit-tested.
- Seat is held only after a verified deposit webhook. Use a DB transaction / row lock on Departure to avoid overselling.
- Departure auto-check at cutoff: reached minToConfirm → confirmed, else notify + refund options.

## Environment variables (.env.example)

```
DATABASE_URL=
AUTH_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_WEBHOOK_SECRET=
```
