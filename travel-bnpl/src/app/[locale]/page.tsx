import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessages, isLocale, localePath, locales } from "@/lib/i18n";

type Props = Readonly<{ params: Promise<{ locale: string }> }>;

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);

  const steps = [
    m.home.steps.browse,
    m.home.steps.join,
    m.home.steps.deposit,
    m.home.steps.installments,
  ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-10 px-4 py-16">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{m.app.name}</p>
          <nav aria-label={m.nav.language} className="flex gap-1 text-sm">
            {locales.map((l) => (
              <Link
                key={l}
                href={localePath(l)}
                hrefLang={l}
                aria-current={l === locale ? "page" : undefined}
                className={
                  l === locale
                    ? "rounded-full bg-zinc-900 px-3 py-1 font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "rounded-full px-3 py-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                }
              >
                {m.nav.locales[l]}
              </Link>
            ))}
          </nav>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-balance">{m.home.title}</h1>
        <p className="text-base text-zinc-600 dark:text-zinc-300">{m.app.tagline}</p>
      </header>

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
              {i + 1}
            </span>
            <span className="text-base">{step}</span>
          </li>
        ))}
      </ol>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">{m.home.comingSoon}</p>
    </main>
  );
}
