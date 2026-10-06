import Link from "next/link";
import { getMessages, localePath, locales, type Locale } from "@/lib/i18n";

export function SiteHeader({ locale, path = "/" }: { locale: Locale; path?: string }) {
  const m = getMessages(locale);
  return (
    <header className="flex items-center justify-between gap-4">
      <Link
        href={localePath(locale)}
        className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        {m.app.name}
      </Link>
      <nav aria-label={m.nav.language} className="flex gap-1 text-sm">
        {locales.map((l) => (
          <Link
            key={l}
            href={localePath(l, path)}
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
    </header>
  );
}
