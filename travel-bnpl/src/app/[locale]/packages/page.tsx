import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCard } from "@/components/package-card";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale } from "@/lib/i18n";
import { listPackages } from "@/server/catalog";

type Props = Readonly<{ params: Promise<{ locale: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.packages.heading} · ${m.app.name}` };
}

export default async function PackagesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const packages = await listPackages(locale);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path="/packages" />
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{m.packages.heading}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.packages.lead}</p>
      </section>
      <div className="flex flex-col gap-3">
        {packages.map((p) => (
          <PackageCard key={p.slug} pkg={p} locale={locale} />
        ))}
      </div>
    </main>
  );
}
