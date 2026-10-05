/**
 * Money helpers. All customer-facing amounts are integer KRW (won).
 * Supplier costs in MNT are stored separately together with the FX rate used.
 * Never use floats for money; every function here rejects non-integers.
 */

export type Krw = number;

export function assertKrw(amount: number, label = "amount"): Krw {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError(`${label} must be an integer number of won, got ${amount}`);
  }
  if (amount < 0) {
    throw new RangeError(`${label} must not be negative, got ${amount}`);
  }
  return amount;
}

/** Format as "1,200,000원". */
export function formatKrw(amount: Krw): string {
  assertKrw(amount);
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

/** Format as "₩1,200,000" (for places where the won sign is clearer than 원). */
export function formatKrwSign(amount: Krw): string {
  assertKrw(amount);
  return `₩${new Intl.NumberFormat("ko-KR").format(amount)}`;
}

/**
 * Split `total` into `parts` integer amounts that sum exactly to `total`.
 * The remainder (at most parts-1 won) goes onto the first installments so the
 * last charge is never the odd one.
 */
export function splitKrw(total: Krw, parts: number): Krw[] {
  assertKrw(total, "total");
  if (!Number.isInteger(parts) || parts < 1) {
    throw new RangeError(`parts must be a positive integer, got ${parts}`);
  }
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Percentage of an amount, rounded to whole won (banker's rounding is overkill here). */
export function percentOfKrw(amount: Krw, percent: number): Krw {
  assertKrw(amount);
  if (!Number.isFinite(percent) || percent < 0) {
    throw new RangeError(`percent must be a non-negative number, got ${percent}`);
  }
  return Math.round((amount * percent) / 100);
}

/** Convert MNT to KRW at a given rate (KRW per 1 MNT), rounded to whole won. */
export function mntToKrw(amountMnt: number, krwPerMnt: number): Krw {
  if (!Number.isFinite(amountMnt) || amountMnt < 0) {
    throw new RangeError(`amountMnt must be a non-negative number, got ${amountMnt}`);
  }
  if (!Number.isFinite(krwPerMnt) || krwPerMnt <= 0) {
    throw new RangeError(`krwPerMnt must be a positive number, got ${krwPerMnt}`);
  }
  return Math.round(amountMnt * krwPerMnt);
}
