/**
 * Installment schedule for the remainder after the deposit.
 *
 * Rules (CLAUDE.md / docs/product-spec.md):
 * - 0% interest, no fees: the installments sum exactly to total - deposit.
 * - At most `maxInstallments` monthly charges.
 * - The last charge is due at least `minDaysBeforeDeparture` days before the
 *   departure date. If the booking is too close to departure for monthly
 *   charges, the remainder is charged in fewer installments or in full
 *   together with the deposit.
 *
 * Dates are ISO calendar days (YYYY-MM-DD) in the user's zone (Asia/Seoul);
 * the caller converts to/from UTC instants. Pure function, no I/O.
 */
import { assertKrw, splitKrw, type Krw } from "./money";

export type Installment = {
  /** 1-based position in the plan. */
  seq: number;
  dueDate: string;
  amountKrw: Krw;
};

export type InstallmentPlan = {
  depositKrw: Krw;
  remainderKrw: Krw;
  installments: Installment[];
  /** True when the remainder must be paid with the deposit (no time left). */
  payInFull: boolean;
};

export type ScheduleOptions = {
  totalKrw: Krw;
  depositKrw: Krw;
  bookingDate: string;
  departureDate: string;
  maxInstallments?: number;
  /** First installment is due this many days after booking. */
  firstDueAfterDays?: number;
  /** Last installment must be due at least this many days before departure. */
  minDaysBeforeDeparture?: number;
};

const DEFAULTS = { maxInstallments: 4, firstDueAfterDays: 30, minDaysBeforeDeparture: 7 };

function parse(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new RangeError(`expected YYYY-MM-DD, got ${iso}`);
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(t)) throw new RangeError(`invalid date ${iso}`);
  return t;
}

function toIso(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toIso(parse(iso) + days * 86_400_000);
}

export function daysBetween(fromIso: string, toIso_: string): number {
  return Math.round((parse(toIso_) - parse(fromIso)) / 86_400_000);
}

/**
 * Same day-of-month `months` later, clamped to the last day of that month
 * (Jan 31 + 1 month = Feb 28/29).
 */
export function addMonthsClamped(iso: string, months: number): string {
  const t = parse(iso);
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const day = d.getUTCDate();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return toIso(Date.UTC(y, m, Math.min(day, lastDay)));
}

export function buildInstallmentSchedule(opts: ScheduleOptions): InstallmentPlan {
  const totalKrw = assertKrw(opts.totalKrw, "totalKrw");
  const depositKrw = assertKrw(opts.depositKrw, "depositKrw");
  if (depositKrw > totalKrw) {
    throw new RangeError(`depositKrw (${depositKrw}) exceeds totalKrw (${totalKrw})`);
  }
  const maxInstallments = opts.maxInstallments ?? DEFAULTS.maxInstallments;
  const firstDueAfterDays = opts.firstDueAfterDays ?? DEFAULTS.firstDueAfterDays;
  const minDaysBeforeDeparture = opts.minDaysBeforeDeparture ?? DEFAULTS.minDaysBeforeDeparture;
  if (!Number.isInteger(maxInstallments) || maxInstallments < 1) {
    throw new RangeError(`maxInstallments must be a positive integer, got ${maxInstallments}`);
  }
  if (daysBetween(opts.bookingDate, opts.departureDate) < 0) {
    throw new RangeError("departureDate is before bookingDate");
  }

  const remainderKrw = totalKrw - depositKrw;
  const lastAllowed = addDays(opts.departureDate, -minDaysBeforeDeparture);
  const firstDue = addDays(opts.bookingDate, firstDueAfterDays);

  if (remainderKrw === 0) {
    return { depositKrw, remainderKrw, installments: [], payInFull: false };
  }

  // Not even one monthly charge fits before the cutoff: pay everything now.
  if (daysBetween(firstDue, lastAllowed) < 0) {
    return { depositKrw, remainderKrw, installments: [], payInFull: true };
  }

  // Count how many monthly due dates fit between firstDue and lastAllowed.
  let count = 1;
  while (
    count < maxInstallments &&
    daysBetween(addMonthsClamped(firstDue, count), lastAllowed) >= 0
  ) {
    count++;
  }

  const amounts = splitKrw(remainderKrw, count);
  const installments = amounts.map((amountKrw, i) => ({
    seq: i + 1,
    dueDate: addMonthsClamped(firstDue, i),
    amountKrw,
  }));

  return { depositKrw, remainderKrw, installments, payInFull: false };
}
