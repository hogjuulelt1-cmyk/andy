/**
 * Loads seed/packages.json and seed/departures.json into the database.
 * Idempotent: packages, add-ons and departures are upserted by slug/id,
 * itineraries are replaced.
 *
 * Prices are placeholders (see the "_note" fields), not quotes.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type DepartureStatus } from "../src/generated/prisma/client";
import { assertKrw } from "../src/lib/money";

type Localized = { ko: string; en: string };

type SeedPackage = {
  slug: string;
  title: { ko: string; en: string; mn: string };
  summary: Localized;
  days: number;
  nights: number;
  season: string;
  priceRangeKrw: [number, number];
  flightPortionKrw: [number, number];
  highlights: { ko: string[]; en: string[] };
  itinerary: { day: number; title: string; titleKo: string; stay: string | null }[];
};

type SeedPackages = {
  packages: SeedPackage[];
  addOns: { slug: string; title: string }[];
};

type SeedDeparture = {
  id: string;
  packageSlug: string;
  startDate: string;
  capacity: number;
  minToConfirm: number;
  priceKrw: number;
  depositKrw: number;
  status: DepartureStatus;
};

type SeedDepartures = { departures: SeedDeparture[] };

// Departures close for new joins this many days before start (docs/product-spec.md).
const CONFIRM_CUTOFF_DAYS = 14;

function utcDate(isoDate: string, plusDays = 0): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + plusDays));
}

async function readJson<T>(rel: string): Promise<T> {
  return JSON.parse(await readFile(path.resolve(__dirname, rel), "utf8")) as T;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const seed = await readJson<SeedPackages>("../seed/packages.json");
  const depSeed = await readJson<SeedDepartures>("../seed/departures.json");

  const packageIds = new Map<string, { id: string; days: number }>();

  for (const p of seed.packages) {
    const [priceFromKrw, priceToKrw] = p.priceRangeKrw.map((v) => assertKrw(v, `${p.slug} price`));
    const depositKrw = assertKrw(p.flightPortionKrw[1], `${p.slug} flight portion`);

    const data = {
      titleKo: p.title.ko,
      titleEn: p.title.en,
      titleMn: p.title.mn,
      days: p.days,
      nights: p.nights,
      season: p.season,
      priceFromKrw,
      priceToKrw,
      depositKrw,
      description: p.summary.ko,
      highlights: p.highlights.ko,
    };

    const pkg = await prisma.package.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });
    packageIds.set(p.slug, { id: pkg.id, days: p.days });

    await prisma.packageDay.deleteMany({ where: { packageId: pkg.id } });
    await prisma.packageDay.createMany({
      data: p.itinerary.map((d) => ({
        packageId: pkg.id,
        dayNumber: d.day,
        title: d.titleKo,
        description: d.title,
        stay: d.stay,
      })),
    });
    console.log(`package ${p.slug}: ${p.itinerary.length} days`);
  }

  for (const d of depSeed.departures) {
    const pkg = packageIds.get(d.packageSlug);
    if (!pkg) throw new Error(`departure ${d.id}: unknown package ${d.packageSlug}`);
    const data = {
      packageId: pkg.id,
      startDate: utcDate(d.startDate),
      endDate: utcDate(d.startDate, pkg.days - 1),
      capacity: d.capacity,
      minToConfirm: d.minToConfirm,
      priceKrw: assertKrw(d.priceKrw, `${d.id} price`),
      depositKrw: assertKrw(d.depositKrw, `${d.id} deposit`),
      status: d.status,
      confirmCutoffDate: utcDate(d.startDate, -CONFIRM_CUTOFF_DAYS),
    };
    await prisma.departure.upsert({
      where: { id: d.id },
      create: { id: d.id, ...data },
      update: data,
    });
  }
  console.log(`${depSeed.departures.length} departures`);

  for (const a of seed.addOns) {
    await prisma.addOn.upsert({
      where: { slug: a.slug },
      create: { slug: a.slug, title: a.title },
      update: { title: a.title },
    });
  }
  console.log(`${seed.addOns.length} add-ons`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
