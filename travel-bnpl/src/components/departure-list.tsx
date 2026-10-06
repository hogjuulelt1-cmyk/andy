import Link from "next/link";
import { getMessages, localePath, type Locale } from "@/lib/i18n";
import { formatKrw } from "@/lib/money";
import { formatMonth, formatRange, monthKey } from "@/lib/dates";
import { t } from "@/lib/format";
import { isJoinable, seatsLeft, type Departure } from "@/server/catalog";

const statusClass: Record<Departure["status"], string> = {
  open: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  full: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  completed: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function SeatMeter({ d }: { d: Departure }) {
  const dots = Array.from({ length: d.capacity }, (_, i) => i < d.booked);
  return (
    <span className="flex gap-1" aria-hidden="true">
      {dots.map((filled, i) => (
        <span
          key={i}
          className={
            "size-2.5 rounded-full " +
            (filled ? "bg-zinc-900 dark:bg-zinc-50" : "bg-zinc-200 dark:bg-zinc-700")
          }
        />
      ))}
    </span>
  );
}

export function DepartureList({ departures, locale }: { departures: Departure[]; locale: Locale }) {
  const m = getMessages(locale);
  if (departures.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{m.detail.noDepartures}</p>;
  }

  const groups = new Map<string, Departure[]>();
  for (const d of departures) {
    const k = monthKey(d.startDate);
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.entries()].map(([k, list]) => (
        <section key={k} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {formatMonth(list[0].startDate, locale)}
          </h3>
          <ul className="flex flex-col gap-3">
            {list.map((d) => {
              const left = seatsLeft(d);
              const joinable = isJoinable(d);
              return (
                <li
                  key={d.id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{formatRange(d.startDate, d.endDate, locale)}</p>
                    <span
                      className={
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium " +
                        statusClass[d.status]
                      }
                    >
                      {m.departure.status[d.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <SeatMeter d={d} />
                    <span className="tabular-nums">
                      {t(m.departure.seats, { booked: d.booked, capacity: d.capacity })}
                    </span>
                    {joinable && (
                      <span className="text-zinc-500 dark:text-zinc-400">
                        · {t(m.departure.seatsLeft, { n: left })}
                      </span>
                    )}
                  </div>
                  {d.status === "open" && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t(m.departure.minToConfirm, { n: d.minToConfirm })}
                    </p>
                  )}
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <dt className="text-zinc-500 dark:text-zinc-400">{m.departure.totalLabel}</dt>
                    <dd className="text-right font-semibold tabular-nums">
                      {formatKrw(d.priceKrw)}
                    </dd>
                    <dt className="text-zinc-500 dark:text-zinc-400">{m.departure.depositLabel}</dt>
                    <dd className="text-right tabular-nums">{formatKrw(d.depositKrw)}</dd>
                  </dl>
                  {joinable ? (
                    <Link
                      href={localePath(locale, `/departures/${d.id}/join`)}
                      className="mt-1 rounded-full bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
                    >
                      {m.departure.join}
                    </Link>
                  ) : (
                    <span className="mt-1 rounded-full bg-zinc-200 px-4 py-2 text-center text-sm font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {m.departure.status[d.status]}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
