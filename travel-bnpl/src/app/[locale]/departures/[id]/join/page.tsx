import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { formatDay, formatRange } from "@/lib/dates";
import { t } from "@/lib/format";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { buildInstallmentSchedule } from "@/lib/installments";
import { formatKrw } from "@/lib/money";
import { getDeparture, getPackage, isJoinable } from "@/server/catalog";

type Props = Readonly<{ params: Promise<{ locale: string; id: string }> }>;

// The schedule depends on today's date, so this page is rendered per request.
export const dynamic = "force-dynamic";

function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.join.heading} · ${m.app.name}` };
}

export default async function JoinPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dep = await getDeparture(id);
  if (!dep) notFound();
  const pkg = await getPackage(dep.packageSlug, locale);
  if (!pkg) notFound();
  const m = getMessages(locale);
  const joinable = isJoinable(dep);

  const plan = buildInstallmentSchedule({
    totalKrw: dep.priceKrw,
    depositKrw: dep.depositKrw,
    bookingDate: todayInSeoul(),
    departureDate: dep.startDate,
  });
  const payTodayKrw = plan.depositKrw + (plan.payInFull ? plan.remainderKrw : 0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path={`/departures/${dep.id}/join`} />

      <nav className="text-sm">
        <Link
          href={localePath(locale, `/packages/${pkg.slug}#departures`)}
          className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← {m.join.back}
        </Link>
      </nav>

      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold leading-tight text-balance">{m.join.heading}</h1>
        <p className="text-base font-semibold">{pkg.title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {formatRange(dep.startDate, dep.endDate, locale)}
        </p>
      </section>

      {!joinable && (
        <p
          role="status"
          className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          {m.join.notJoinable}
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{m.join.summary}</h2>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500 dark:text-zinc-400">{m.join.total}</dt>
            <dd className="tabular-nums">{formatKrw(dep.priceKrw)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500 dark:text-zinc-400">{m.join.deposit}</dt>
            <dd className="tabular-nums">{formatKrw(plan.depositKrw)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500 dark:text-zinc-400">{m.join.remainder}</dt>
            <dd className="tabular-nums">{formatKrw(plan.remainderKrw)}</dd>
          </div>
          <div className="mt-1 flex justify-between gap-3 border-t border-zinc-200 pt-2 dark:border-zinc-700">
            <dt className="font-semibold">{m.join.today}</dt>
            <dd className="text-lg font-bold tabular-nums">{formatKrw(payTodayKrw)}</dd>
          </div>
        </dl>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.join.seatHold}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{m.join.schedule}</h2>
        {plan.payInFull ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.join.payInFull}</p>
        ) : plan.installments.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.join.noRemainder}</p>
        ) : (
          <ol className="flex flex-col">
            {plan.installments.map((i) => (
              <li
                key={i.seq}
                className="flex items-center justify-between gap-3 border-b border-zinc-200 py-3 last:border-b-0 dark:border-zinc-800"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {t(m.join.installment, { n: i.seq })}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t(m.join.due, { date: formatDay(i.dueDate, locale) })}
                  </span>
                </div>
                <span className="font-semibold tabular-nums">{formatKrw(i.amountKrw)}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {m.join.scheduleHint} · {m.join.bookingDate}
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="rounded-full bg-zinc-900 px-5 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {m.join.cta} · {formatKrw(payTodayKrw)}
        </button>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">{m.join.ctaSoon}</p>
      </div>
    </main>
  );
}
