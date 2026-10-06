import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DepartureList } from "@/components/departure-list";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale, localePath, locales } from "@/lib/i18n";
import { formatKrw } from "@/lib/money";
import { t } from "@/lib/format";
import { getPackage, listDepartures, listPackageSlugs } from "@/server/catalog";

type Props = Readonly<{ params: Promise<{ locale: string; slug: string }> }>;

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await listPackageSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const pkg = await getPackage(slug, locale);
  if (!pkg) return {};
  const m = getMessages(locale);
  return { title: `${pkg.title} · ${m.app.name}`, description: pkg.summary };
}

export default async function PackagePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const pkg = await getPackage(slug, locale);
  if (!pkg) notFound();
  const m = getMessages(locale);
  const departures = await listDepartures(slug);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path={`/packages/${slug}`} />

      <nav className="text-sm">
        <Link
          href={localePath(locale, "/packages")}
          className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← {m.nav.packages}
        </Link>
      </nav>

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight text-balance">{pkg.title}</h1>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {t(m.packages.daysNights, { days: pkg.days, nights: pkg.nights })}
          </span>
        </div>
        <p className="text-base text-zinc-600 dark:text-zinc-300">{pkg.summary}</p>
        <ul className="flex flex-wrap gap-2">
          {pkg.highlights.map((h) => (
            <li
              key={h}
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-800"
            >
              {h}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {m.detail.price} · {m.packages.perPerson}
          </span>
          <span className="text-lg font-bold tabular-nums">
            {t(m.packages.fromTo, {
              from: formatKrw(pkg.priceFromKrw),
              to: formatKrw(pkg.priceToKrw),
            })}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{m.packages.deposit}</span>
          <span className="font-semibold tabular-nums">
            {t(m.packages.fromTo, {
              from: formatKrw(pkg.depositFromKrw),
              to: formatKrw(pkg.depositToKrw),
            })}
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.packages.depositHint}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.detail.remaining}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.detail.priceNote}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{m.detail.itinerary}</h2>
        <ol className="flex flex-col">
          {pkg.itinerary.map((d) => (
            <li
              key={d.dayNumber}
              className="flex gap-4 border-b border-zinc-200 py-3 last:border-b-0 dark:border-zinc-800"
            >
              <span className="w-14 shrink-0 text-sm font-semibold text-zinc-500 tabular-nums dark:text-zinc-400">
                {t(m.detail.day, { n: d.dayNumber })}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm">{d.title}</p>
                {d.stay && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {m.detail.stay}: {d.stay}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{m.detail.included}</h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {pkg.included.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-zinc-400">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="departures" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{m.detail.departures}</h2>
        <DepartureList departures={departures} locale={locale} />
      </section>
    </main>
  );
}
