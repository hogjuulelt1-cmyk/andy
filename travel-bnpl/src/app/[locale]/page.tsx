import Link from "next/link";
import { notFound } from "next/navigation";
import { SceneArt } from "@/components/art";
import { PackageCard } from "@/components/package-card";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { listPackages } from "@/server/catalog";

type Props = Readonly<{ params: Promise<{ locale: string }> }>;

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const packages = await listPackages(locale);

  const steps = [
    m.home.steps.browse,
    m.home.steps.join,
    m.home.steps.deposit,
    m.home.steps.installments,
  ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-10 px-4 py-10">
      <SiteHeader locale={locale} />

      <section className="flex flex-col gap-3">
        <SceneArt scene="stars" seed={7} title={m.home.title} />
        <h1 className="text-3xl font-bold leading-tight text-balance">{m.home.title}</h1>
        <p className="text-base text-zinc-600 dark:text-zinc-300">{m.app.tagline}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={localePath(locale, "/match")}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            {m.home.matchCta}
          </Link>
          <Link
            href={localePath(locale, "/packages")}
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold dark:border-zinc-700"
          >
            {m.home.cta}
          </Link>
        </div>
      </section>

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

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{m.packages.heading}</h2>
        <div className="flex flex-col gap-3">
          {packages.map((p) => (
            <PackageCard key={p.slug} pkg={p} locale={locale} />
          ))}
        </div>
      </section>
    </main>
  );
}
