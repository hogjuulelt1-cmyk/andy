/**
 * Catalog data access: packages and departures.
 *
 * Until a database is wired up (DATABASE_URL), everything is read from
 * seed/*.json so the browse pages work in any environment. The shapes here
 * mirror the Prisma models so the swap to `prisma.package.findMany()` is a
 * drop-in change inside this module only.
 */
import packagesSeed from "../../seed/packages.json";
import departuresSeed from "../../seed/departures.json";
import type { Locale } from "@/lib/i18n";
import { assertKrw } from "@/lib/money";

export type DepartureStatus = "open" | "confirmed" | "full" | "cancelled" | "completed";

export type PackageDay = {
  dayNumber: number;
  title: string;
  stay: string | null;
};

export type TourPackage = {
  slug: string;
  title: string;
  summary: string;
  days: number;
  nights: number;
  seasonLabel: string;
  priceFromKrw: number;
  priceToKrw: number;
  depositFromKrw: number;
  depositToKrw: number;
  highlights: string[];
  included: string[];
  itinerary: PackageDay[];
};

export type Departure = {
  id: string;
  packageSlug: string;
  /** ISO calendar date (YYYY-MM-DD) in Asia/Seoul. */
  startDate: string;
  endDate: string;
  capacity: number;
  minToConfirm: number;
  priceKrw: number;
  depositKrw: number;
  booked: number;
  status: DepartureStatus;
};

type SeedPackage = (typeof packagesSeed.packages)[number];
type SeedDeparture = (typeof departuresSeed.departures)[number];

function pick<T extends { ko: string; en: string }>(obj: T, locale: Locale): string {
  return obj[locale];
}

function toPackage(p: SeedPackage, locale: Locale): TourPackage {
  const [priceFromKrw, priceToKrw] = p.priceRangeKrw;
  const [depositFromKrw, depositToKrw] = p.flightPortionKrw;
  return {
    slug: p.slug,
    title: pick(p.title, locale),
    summary: pick(p.summary, locale),
    days: p.days,
    nights: p.nights,
    seasonLabel: pick(p.seasonLabel, locale),
    priceFromKrw: assertKrw(priceFromKrw),
    priceToKrw: assertKrw(priceToKrw),
    depositFromKrw: assertKrw(depositFromKrw),
    depositToKrw: assertKrw(depositToKrw),
    highlights: p.highlights[locale],
    included: p.included[locale],
    itinerary: p.itinerary.map((d) => ({
      dayNumber: d.day,
      title: locale === "ko" ? d.titleKo : d.title,
      stay: locale === "ko" ? d.stayKo : d.stay,
    })),
  };
}

/** Add whole days to a YYYY-MM-DD string without touching time zones. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d + days);
  return new Date(t).toISOString().slice(0, 10);
}

function toDeparture(d: SeedDeparture, days: number): Departure {
  return {
    id: d.id,
    packageSlug: d.packageSlug,
    startDate: d.startDate,
    endDate: addDays(d.startDate, days - 1),
    capacity: d.capacity,
    minToConfirm: d.minToConfirm,
    priceKrw: assertKrw(d.priceKrw),
    depositKrw: assertKrw(d.depositKrw),
    booked: d.booked,
    status: d.status as DepartureStatus,
  };
}

export async function listPackages(locale: Locale): Promise<TourPackage[]> {
  return packagesSeed.packages.map((p) => toPackage(p, locale));
}

export async function getPackage(slug: string, locale: Locale): Promise<TourPackage | null> {
  const p = packagesSeed.packages.find((x) => x.slug === slug);
  return p ? toPackage(p, locale) : null;
}

export async function listPackageSlugs(): Promise<string[]> {
  return packagesSeed.packages.map((p) => p.slug);
}

export async function listDepartures(packageSlug: string): Promise<Departure[]> {
  const p = packagesSeed.packages.find((x) => x.slug === packageSlug);
  if (!p) return [];
  return departuresSeed.departures
    .filter((d) => d.packageSlug === packageSlug)
    .map((d) => toDeparture(d, p.days))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getDeparture(id: string): Promise<Departure | null> {
  const d = departuresSeed.departures.find((x) => x.id === id);
  if (!d) return null;
  const p = packagesSeed.packages.find((x) => x.slug === d.packageSlug);
  return p ? toDeparture(d, p.days) : null;
}

/** Seats still open on a departure (never negative). */
export function seatsLeft(d: Pick<Departure, "capacity" | "booked">): number {
  return Math.max(0, d.capacity - d.booked);
}

/** Can a user still join this departure? */
export function isJoinable(d: Departure): boolean {
  return (d.status === "open" || d.status === "confirmed") && seatsLeft(d) > 0;
}
