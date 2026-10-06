import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { formatDay, formatRange } from "@/lib/dates";
import { t } from "@/lib/format";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { formatKrw } from "@/lib/money";
import { cancelPendingAction } from "@/server/actions";
import { getDeparture, getPackage } from "@/server/catalog";
import { getUser, listBookings } from "@/server/session";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ paid?: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.my.heading} · ${m.app.name}` };
}

const statusClass = {
  pending_deposit: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  seat_held: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  paid_in_full: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export default async function MyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { paid } = await searchParams;
  const m = getMessages(locale);
  const user = await getUser();
  const bookings = user ? await listBookings() : [];

  const rows = await Promise.all(
    bookings.map(async (b) => {
      const dep = await getDeparture(b.departureId);
      const pkg = dep && (await getPackage(dep.packageSlug, locale));
      return dep && pkg ? { b, dep, pkg } : null;
    }),
  );

  const btn =
    "rounded-full bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900";
  const btnGhost =
    "rounded-full border border-zinc-300 px-4 py-2 text-center text-sm font-semibold dark:border-zinc-700";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path="/my" />
      <h1 className="text-2xl font-bold">{m.my.heading}</h1>

      {paid && (
        <p
          role="status"
          className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {m.my.paidBanner}
        </p>
      )}

      {!user || rows.every((r) => r === null) ? (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.my.empty}</p>
          {!user && (
            <Link
              href={
                localePath(locale, "/login") +
                `?next=${encodeURIComponent(localePath(locale, "/my"))}`
              }
              className={btn + " w-fit"}
            >
              {m.nav.login}
            </Link>
          )}
          <Link href={localePath(locale, "/packages")} className={btnGhost + " w-fit"}>
            {m.my.browse}
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => {
            if (!r) return null;
            const { b, dep, pkg } = r;
            const paidVia = (method?: string, months?: number) =>
              months && months > 1
                ? t(m.my.installmentVia, { n: months })
                : method
                  ? t(m.my.paidVia, { method: m.pay[method as keyof typeof m.pay] })
                  : null;
            return (
              <li
                key={b.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <p className="font-semibold">{pkg.title}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {formatRange(dep.startDate, dep.endDate, locale)}
                    </p>
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium " +
                      statusClass[b.status]
                    }
                  >
                    {m.my.status[b.status]}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <dt className="text-zinc-500 dark:text-zinc-400">{m.join.total}</dt>
                  <dd className="text-right tabular-nums">{formatKrw(b.totalKrw)}</dd>
                  <dt className="text-zinc-500 dark:text-zinc-400">{m.join.deposit}</dt>
                  <dd className="text-right tabular-nums">
                    {formatKrw(b.depositKrw)}
                    {b.status !== "pending_deposit" && b.depositMethod && (
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {paidVia(b.depositMethod)}
                      </span>
                    )}
                  </dd>
                  <dt className="text-zinc-500 dark:text-zinc-400">{m.join.remainder}</dt>
                  <dd className="text-right tabular-nums">
                    {formatKrw(b.remainderKrw)}
                    {b.status === "paid_in_full" && b.remainderKrw > 0 && (
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {paidVia(b.remainderMethod, b.remainderInstallmentMonths)}
                      </span>
                    )}
                  </dd>
                </dl>

                {b.status === "seat_held" && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-200">
                    {t(m.my.remainderDue, {
                      amount: formatKrw(b.remainderKrw),
                      date: formatDay(b.remainderDue, locale),
                    })}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {b.status === "pending_deposit" && (
                    <>
                      <Link href={localePath(locale, `/pay/${b.id}`)} className={btn}>
                        {m.my.continueDeposit}
                      </Link>
                      <form action={cancelPendingAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="bookingId" value={b.id} />
                        <button type="submit" className={btnGhost}>
                          {m.my.cancel}
                        </button>
                      </form>
                    </>
                  )}
                  {b.status === "seat_held" && (
                    <Link href={localePath(locale, `/pay/${b.id}`)} className={btn}>
                      {m.my.payRemainder}
                    </Link>
                  )}
                  {b.status !== "pending_deposit" && (
                    <Link
                      href={localePath(locale, `/departures/${dep.id}/group`)}
                      className={btnGhost}
                    >
                      {m.my.group}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
