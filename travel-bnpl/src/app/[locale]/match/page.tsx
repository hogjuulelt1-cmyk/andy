import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchBadge } from "@/components/match-badge";
import { SiteHeader } from "@/components/site-header";
import { formatRange } from "@/lib/dates";
import { t } from "@/lib/format";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { OPTIONS, QUESTION_KEYS, groupMatch, type QuestionKey } from "@/lib/matching";
import { formatKrw } from "@/lib/money";
import { clearProfileAction, saveProfileAction } from "@/server/actions";
import { getPackage, isJoinable, listAllDepartures, seatsLeft } from "@/server/catalog";
import { membersOf } from "@/server/members";
import { getProfile } from "@/server/session";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; edit?: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.match.heading} · ${m.app.name}` };
}

export default async function MatchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { saved, edit } = await searchParams;
  const m = getMessages(locale);
  const profile = await getProfile();

  const optionLabel = (k: QuestionKey, v: string) =>
    (m.match.a[k] as Record<string, string>)[v] ?? v;

  if (!profile || edit) {
    const current = profile;
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
        <SiteHeader locale={locale} path="/match" />
        <section className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-balance">{m.match.heading}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.match.lead}</p>
        </section>

        <form action={saveProfileAction} className="flex flex-col gap-6">
          <input type="hidden" name="locale" value={locale} />

          {QUESTION_KEYS.map((k) => (
            <fieldset key={k} className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold">{m.match.q[k]}</legend>
              <div className="flex flex-wrap gap-2">
                {OPTIONS[k].map((v, i) => (
                  <label
                    key={v}
                    className="cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:has-checked:border-zinc-50 dark:has-checked:bg-zinc-50 dark:has-checked:text-zinc-900"
                  >
                    <input
                      type="radio"
                      name={k}
                      value={v}
                      defaultChecked={current ? current[k] === v : i === 0}
                      className="sr-only"
                    />
                    {optionLabel(k, v)}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">{m.match.gender}</legend>
            <div className="flex flex-wrap gap-2">
              {(["f", "m", "other"] as const).map((g, i) => (
                <label
                  key={g}
                  className="cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:has-checked:border-zinc-50 dark:has-checked:bg-zinc-50 dark:has-checked:text-zinc-900"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    defaultChecked={current ? current.gender === g : i === 0}
                    className="sr-only"
                  />
                  {g === "f" ? m.match.genderF : g === "m" ? m.match.genderM : m.match.genderO}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold">{m.match.mbti}</span>
            <input
              id="mbti"
              name="mbti"
              maxLength={4}
              defaultValue={current?.mbti ?? ""}
              placeholder={m.match.mbtiPlaceholder}
              autoCapitalize="characters"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base uppercase text-zinc-900 placeholder:normal-case placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{m.match.mbtiHint}</span>
          </label>

          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-3 text-base font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            {m.match.submit}
          </button>
        </form>
      </main>
    );
  }

  const deps = await listAllDepartures();
  const rows = await Promise.all(
    deps
      .filter((d) => isJoinable(d))
      .map(async (d) => {
        const pkg = await getPackage(d.packageSlug, locale);
        const members = membersOf(d.id, d.memberIndexes, locale);
        const g = groupMatch(
          profile,
          members.map((x) => x.profile),
        );
        return pkg ? { d, pkg, members, g } : null;
      }),
  );
  const ranked = rows
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => (b.g?.score ?? -1) - (a.g?.score ?? -1));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path="/match" />
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-balance">{m.match.results}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.match.resultsLead}</p>
        {saved && (
          <p
            role="status"
            className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          >
            {m.match.saved}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {profile.mbti && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-semibold dark:bg-zinc-800">
              {profile.mbti}
            </span>
          )}
          {QUESTION_KEYS.map((k) => (
            <span key={k} className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
              {optionLabel(k, profile[k])}
            </span>
          ))}
          <form action={clearProfileAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="underline underline-offset-4">
              {m.match.edit}
            </button>
          </form>
        </div>
      </section>

      <ol className="flex flex-col gap-4">
        {ranked.map(({ d, pkg, members, g }) => (
          <li
            key={d.id}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <p className="font-semibold">{pkg.title}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {formatRange(d.startDate, d.endDate, locale)}
                </p>
              </div>
              {g ? (
                <MatchBadge score={g.score} label={t(m.match.score, { n: g.score })} />
              ) : (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium dark:bg-zinc-800">
                  {m.match.empty}
                </span>
              )}
            </div>

            {members.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {members.map((x) => {
                  const s = g?.perMember.find((p) => p.index === members.indexOf(x))?.score;
                  return (
                    <li
                      key={x.id}
                      className="flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-0.5 text-xs dark:border-zinc-800"
                    >
                      <span className="font-medium">{x.name}</span>
                      {x.profile.mbti && <span className="text-zinc-500">{x.profile.mbti}</span>}
                      {s !== undefined && <span className="tabular-nums text-zinc-500">{s}%</span>}
                    </li>
                  );
                })}
              </ul>
            )}

            {g && g.topReasons.length > 0 && (
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {m.match.reasons}: {g.topReasons.map((r) => m.match.reason[r]).join(" · ")}
              </p>
            )}
            {g && !g.mixOk && (
              <p className="text-xs text-amber-700 dark:text-amber-300">{m.match.mixWarn}</p>
            )}

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-500 tabular-nums dark:text-zinc-400">
                {t(m.departure.seats, { booked: d.booked, capacity: d.capacity })} ·{" "}
                {t(m.departure.seatsLeft, { n: seatsLeft(d) })} · {formatKrw(d.priceKrw)}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href={localePath(locale, `/departures/${d.id}/join`)}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
              >
                {m.match.join}
              </Link>
              <Link
                href={localePath(locale, `/departures/${d.id}/group`)}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
              >
                {m.match.viewGroup}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
