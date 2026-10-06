import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Checklist, GroupChat } from "@/components/group-tools";
import { SiteHeader } from "@/components/site-header";
import { formatRange } from "@/lib/dates";
import { t } from "@/lib/format";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { daysBetween } from "@/lib/installments";
import { getDeparture, getPackage } from "@/server/catalog";
import { mockChat, mockMembers } from "@/server/members";
import { findBookingForDeparture, getUser, todayInSeoul } from "@/server/session";

type Props = Readonly<{ params: Promise<{ locale: string; id: string }> }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.group.heading} · ${m.app.name}` };
}

export default async function GroupPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dep = await getDeparture(id);
  if (!dep) notFound();
  const pkg = await getPackage(dep.packageSlug, locale);
  if (!pkg) notFound();
  const m = getMessages(locale);
  const user = await getUser();
  const booking = await findBookingForDeparture(dep.id);
  const isMember = !!user && !!booking && booking.status !== "pending_deposit";

  const others = mockMembers(dep.id, dep.booked, locale);
  const members = isMember
    ? [
        ...others,
        { id: "you", name: user.name, intro: "", gender: "f" as const, age: "", isYou: true },
      ]
    : others;
  const booked = members.length;
  const left = Math.max(0, dep.capacity - booked);
  const confirmed = dep.status === "confirmed" || booked >= dep.minToConfirm;
  const dDay = daysBetween(todayInSeoul(), dep.startDate);

  const checklistItems = Object.entries(m.group.items).map(([key, label]) => ({ key, label }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path={`/departures/${dep.id}/group`} />

      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{m.group.heading}</h1>
        <p className="font-semibold">{pkg.title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {formatRange(dep.startDate, dep.endDate, locale)}
        </p>
        <div className="mt-1 flex flex-wrap gap-2 text-sm">
          <span
            className={
              "rounded-full px-3 py-1 font-medium " +
              (confirmed
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")
            }
          >
            {confirmed ? m.group.confirmed : t(m.group.needMore, { n: dep.minToConfirm - booked })}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium tabular-nums dark:bg-zinc-800">
            {dDay > 0 ? t(m.group.countdown, { n: dDay }) : m.group.today}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">{m.group.members}</h2>
          <span className="text-sm text-zinc-500 tabular-nums dark:text-zinc-400">
            {t(m.group.seats, { booked, capacity: dep.capacity, left })}
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {members.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold dark:bg-zinc-700">
                {p.name.slice(0, 1)}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">
                  {p.name}
                  {p.isYou && (
                    <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      ({m.group.you})
                    </span>
                  )}
                  {p.age && (
                    <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {p.age}
                    </span>
                  )}
                </span>
                {p.intro && (
                  <span className="text-xs text-zinc-600 dark:text-zinc-300">{p.intro}</span>
                )}
              </div>
            </li>
          ))}
          {Array.from({ length: left }, (_, i) => (
            <li
              key={`empty-${i}`}
              className="rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-400 dark:border-zinc-700"
            >
              ·
            </li>
          ))}
        </ul>
      </section>

      {isMember ? (
        <>
          <GroupChat
            departureId={dep.id}
            you={user.name}
            seed={mockChat(dep.id, others, locale)}
            labels={{
              heading: m.group.chat,
              placeholder: m.group.chatPlaceholder,
              send: m.group.send,
              note: m.group.chatNote,
            }}
          />
          <Checklist
            departureId={dep.id}
            items={checklistItems}
            labels={{ heading: m.group.checklist, note: m.group.checklistNote }}
          />
        </>
      ) : (
        <section className="flex flex-col gap-3 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{m.group.notMember}</p>
          <Link
            href={localePath(locale, `/departures/${dep.id}/join`)}
            className="w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            {m.group.join}
          </Link>
        </section>
      )}
    </main>
  );
}
