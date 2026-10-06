/**
 * Catalog data access: packages, places and departures.
 *
 * Until a database is wired up (DATABASE_URL), everything is read from
 * seed/*.json so the browse pages work in any environment. The shapes here
 * mirror the Prisma models so the swap to `prisma.package.findMany()` is a
 * drop-in change inside this module only.
 */
import packagesSeed from "../../seed/packages.json";
import departuresSeed from "../../seed/departures.json";
import placesSeed from "../../seed/places.json";
import type { Scene, RouteStop } from "@/lib/art";
import type { Locale } from "@/lib/i18n";
import { assertKrw } from "@/lib/money";

export type DepartureStatus = "open" | "confirmed" | "full" | "cancelled" | "completed";

export type Place = { key: string; lat: number; lon: number; name: string; scene: Scene };

export type PackageDay = {
  dayNumber: number;
  title: string;
  stay: string | null;
  place: Place;
};

export type TourPackage = {
  slug: string;
  title: string;
  badge: string;
  summary: string;
  days: number;
  nights: number;
  seasonLabel: string;
  priceFromKrw: number;
  priceToKrw: number;
  depositFromKrw: number;
  depositToKrw: number;
  hero: Scene;
  highlights: string[];
  included: string[];
  itinerary: PackageDay[];
  route: RouteStop[];
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
  /** Indexes into the mock member pool (demo only). */
  memberIndexes: number[];
  status: DepartureStatus;
};

type SeedPackage = (typeof packagesSeed.packages)[number];
type SeedDeparture = (typeof departuresSeed.departures)[number];
type SeedPlace = (typeof placesSeed.places)[keyof typeof placesSeed.places];

function pick<T extends { ko: string; en: string }>(obj: T, locale: Locale): string {
  return obj[locale];
}

export function getPlace(key: string, locale: Locale): Place {
  const p = (placesSeed.places as Record<string, SeedPlace>)[key];
  if (!p) throw new Error(`unknown place ${key}`);
  return { key, lat: p.lat, lon: p.lon, name: p[locale], scene: p.scene as Scene };
}

function toPackage(p: SeedPackage, locale: Locale): TourPackage {
  const [priceFromKrw, priceToKrw] = p.priceRangeKrw;
  const [depositFromKrw, depositToKrw] = p.flightPortionKrw;
  const itinerary = p.itinerary.map((d) => ({
    dayNumber: d.day,
    title: locale === "ko" ? d.titleKo : d.title,
    stay: locale === "ko" ? d.stayKo : d.stay,
    place: getPlace(d.place, locale),
  }));
  return {
    slug: p.slug,
    title: pick(p.title, locale),
    badge: pick(p.badge, locale),
    summary: pick(p.summary, locale),
    days: p.days,
    nights: p.nights,
    seasonLabel: pick(p.seasonLabel, locale),
    priceFromKrw: assertKrw(priceFromKrw),
    priceToKrw: assertKrw(priceToKrw),
    depositFromKrw: assertKrw(depositFromKrw),
    depositToKrw: assertKrw(depositToKrw),
    hero: p.hero as Scene,
    highlights: p.highlights[locale],
    included: p.included[locale],
    itinerary,
    route: itinerary.map((d) => ({
      lat: d.place.lat,
      lon: d.place.lon,
      label: d.place.name,
      day: d.dayNumber,
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
    memberIndexes: d.members,
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

export async function listAllDepartures(): Promise<Departure[]> {
  return departuresSeed.departures
    .map((d) => {
      const p = packagesSeed.packages.find((x) => x.slug === d.packageSlug);
      return p ? toDeparture(d, p.days) : null;
    })
    .filter((d): d is Departure => d !== null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function listDepartures(packageSlug: string): Promise<Departure[]> {
  return (await listAllDepartures()).filter((d) => d.packageSlug === packageSlug);
}

export async function getDeparture(id: string): Promise<Departure | null> {
  return (await listAllDepartures()).find((d) => d.id === id) ?? null;
}

/** Seats still open on a departure (never negative). */
export function seatsLeft(d: Pick<Departure, "capacity" | "booked">): number {
  return Math.max(0, d.capacity - d.booked);
}

/** Can a user still join this departure? */
export function isJoinable(d: Departure): boolean {
  return (d.status === "open" || d.status === "confirmed") && seatsLeft(d) > 0;
}
