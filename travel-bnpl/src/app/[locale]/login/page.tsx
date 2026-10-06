import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale } from "@/lib/i18n";
import { signInAction } from "@/server/actions";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.login.heading} · ${m.app.name}` };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next, error } = await searchParams;
  const m = getMessages(locale);

  const providerBtn =
    "flex w-full items-center justify-center rounded-full px-5 py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path="/login" />
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{m.login.heading}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.login.lead}</p>
      </section>

      <form action={signInAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{m.login.name}</span>
          <input
            id="login-name"
            name="name"
            required
            maxLength={40}
            autoComplete="nickname"
            placeholder={m.login.namePlaceholder}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50"
          />
          {error === "name" && (
            <span role="alert" className="text-rose-700 dark:text-rose-300">
              {m.login.errorName}
            </span>
          )}
        </label>
        <button
          type="submit"
          name="provider"
          value="kakao"
          className={`${providerBtn} bg-[#FEE500] text-[#191919]`}
        >
          {m.login.kakao}
        </button>
        <button
          type="submit"
          name="provider"
          value="naver"
          className={`${providerBtn} bg-[#03C75A] text-white`}
        >
          {m.login.naver}
        </button>
      </form>
    </main>
  );
}
