/**
 * Loads seed/packages.json into the database. Idempotent: packages and
 * add-ons are upserted by slug, itineraries are replaced.
 *
 * Prices are placeholders (see seed/packages.json "_note"), not quotes.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { assertKrw, percentOfKrw } from "../src/lib/money";

type SeedPackage = {
  slug: string;
  title: { ko: string; en: string; mn: string };
  days: number;
  nights: number;
  season: string;
  priceRangeKrw: [number, number];
  flightPortionKrw?: [number, number];
  highlights: string[];
  itinerary: { day: number; title: string; stay: string | null }[];
};

type SeedFile = {
  packages: SeedPackage[];
  addOns: { slug: string; title: string }[];
};

// Until a package has a priced flight portion, hold the seat with ~35% of the
// lower price bound (docs/product-spec.md: deposit is 20–40% of total).
const DEFAULT_DEPOSIT_PERCENT = 35;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const file = path.resolve(__dirname, "../seed/packages.json");
  const seed = JSON.parse(await readFile(file, "utf8")) as SeedFile;

  for (const p of seed.packages) {
    const [priceFromKrw, priceToKrw] = p.priceRangeKrw.map((v) => assertKrw(v, `${p.slug} price`));
    const depositKrw = p.flightPortionKrw
      ? assertKrw(p.flightPortionKrw[1], `${p.slug} flight portion`)
      : percentOfKrw(priceFromKrw, DEFAULT_DEPOSIT_PERCENT);

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
      highlights: p.highlights,
    };

    const pkg = await prisma.package.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });

    await prisma.packageDay.deleteMany({ where: { packageId: pkg.id } });
    await prisma.packageDay.createMany({
      data: p.itinerary.map((d) => ({
        packageId: pkg.id,
        dayNumber: d.day,
        title: d.title,
        stay: d.stay,
      })),
    });
    console.log(`package ${p.slug}: ${p.itinerary.length} days`);
  }

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
