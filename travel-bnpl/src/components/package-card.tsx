import Link from "next/link";
import { SceneArt } from "@/components/art";
import { getMessages, localePath, type Locale } from "@/lib/i18n";
import { formatKrw } from "@/lib/money";
import { t } from "@/lib/format";
import type { TourPackage } from "@/server/catalog";

export function PackageCard({ pkg, locale }: { pkg: TourPackage; locale: Locale }) {
  const m = getMessages(locale);
  return (
    <Link
      href={localePath(locale, `/packages/${pkg.slug}`)}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-50"
    >
      <SceneArt
        scene={pkg.hero}
        seed={pkg.slug.length}
        title={pkg.title}
        className="-mx-4 -mt-4 rounded-b-none"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {pkg.badge}
          </span>
          <h2 className="text-lg font-semibold leading-snug">{pkg.title}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {t(m.packages.daysNights, { days: pkg.days, nights: pkg.nights })}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{pkg.summary}</p>
      <dl className="mt-1 flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">{m.packages.perPerson}</dt>
          <dd className="font-semibold tabular-nums">
            {t(m.packages.fromTo, {
              from: formatKrw(pkg.priceFromKrw),
              to: formatKrw(pkg.priceToKrw),
            })}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">{m.packages.deposit}</dt>
          <dd className="tabular-nums">
            {t(m.packages.fromTo, {
              from: formatKrw(pkg.depositFromKrw),
              to: formatKrw(pkg.depositToKrw),
            })}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">{m.packages.season}</dt>
          <dd>{pkg.seasonLabel}</dd>
        </div>
      </dl>
      <span className="mt-1 text-sm font-medium underline-offset-4 group-hover:underline">
        {m.packages.viewDepartures} →
      </span>
    </Link>
  );
}
