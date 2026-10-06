# Product spec (v1 / MVP)

## Target user

- Korean, ~20–35, office workers and students, active on Instagram / Naver cafe / YouTube.
- Wants Mongolia (Gobi, stars, ger, steppe) but finds it hard to organise: needs 5 strangers to fill a vehicle, trusts no one, fears last-minute cancellations.
- Today they search "몽골 동행 구하기" on Naver cafe. That process is messy, has scams and many late dropouts.

## Value proposition

1. **Trusted standard packages** run by us (vehicle + driver + Korean-speaking guide + ger camps + meals).
2. **Companion matching**: join a departure group, see how many seats are filled (e.g. 4/6), chat with the group.
3. **Pay small now**: deposit covering the flight locks the seat; the rest is paid through Toss before departure (무이자 할부 available at checkout).

Note: Koreans already have interest-free card installments (무이자 할부, Toss, Kakao Pay), so "0% installments" alone is not unique. Companion matching + trust + the deposit lock is the real differentiator.

## User flows

1. **Browse**: list of packages → package detail (itinerary per day, what's included, price range, photos, season).
2. **Pick departure**: calendar of departures; each departure = one group/vehicle of max 6 seats, with fill status.
3. **Join**: sign in (Kakao/Naver), profile (name as in passport, gender, age range, short intro), agree to terms.
4. **Pay deposit**: amount = flight cost portion (config per package, ~20–40% of total). Seat is held only after deposit succeeds.
5. **Remainder**: due **≥7 days before departure**, paid through a second Toss Payments checkout. The user may choose card 무이자 할부 there; we show the due date and send reminders, we do not charge cards ourselves.
6. **Group page**: members (first name + intro), group chat, checklist (passport, eSIM, insurance), countdown.
7. **Trip confirmed**: when a departure reaches its minimum (e.g. 4 of 6) by the cutoff date, it is confirmed; otherwise users get options (move date / full refund).
8. **Add-ons**: Naadam tickets, drone photo shoot, deel costume photos, eSIM, insurance, domestic flight upgrade.

## Cancellation / refund rules (draft, needs legal review)

- Departure not confirmed by us → 100% refund.
- User cancels > 30 days before → refund minus a small fee; flight portion per airline rules.
- User cancels < 30 days → deposit (flight) non-refundable; installment part per policy.
- Missed installment → reminder D+0, D+3; after X days seat released and refund per policy.

## Admin / ops (v1)

- CRUD packages, itineraries, departures, price per departure.
- See groups, members, payment status per member, overdue list.
- Supplier costs per departure (vehicle, driver, guide, ger camps) in MNT → margin report in KRW.
- Manually confirm / cancel a departure.

## Out of scope for v1

- Our own lending / credit scoring.
- Native mobile apps (PWA is enough).
- Flight booking API integration (flights bought by ops team; deposit covers it).
- Mongolians travelling to Korea.
