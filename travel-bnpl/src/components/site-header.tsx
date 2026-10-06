import Link from "next/link";
import { getMessages, localePath, locales, type Locale } from "@/lib/i18n";
import { signOutAction } from "@/server/actions";
import { getUser } from "@/server/session";

export async function SiteHeader({ locale, path = "/" }: { locale: Locale; path?: string }) {
  const m = getMessages(locale);
  const user = await getUser();
  const pill =
    "rounded-full px-3 py-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50";
  const pillActive =
    "rounded-full bg-zinc-900 px-3 py-1 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900";

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={localePath(locale)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {m.app.name}
          <span className="rounded-full border border-amber-400 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            {m.nav.demo}
          </span>
        </Link>
        <nav aria-label={m.nav.language} className="flex gap-1">
          {locales.map((l) => (
            <Link
              key={l}
              href={localePath(l, path)}
              hrefLang={l}
              aria-current={l === locale ? "page" : undefined}
              className={l === locale ? pillActive : pill}
            >
              {m.nav.locales[l]}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="flex items-center gap-1 text-sm">
        <Link href={localePath(locale, "/packages")} className={pill}>
          {m.nav.packages}
        </Link>
        <Link href={localePath(locale, "/match")} className={pill}>
          {m.nav.match}
        </Link>
        <Link href={localePath(locale, "/my")} className={pill}>
          {m.nav.my}
        </Link>
        <span className="flex-1" />
        {user ? (
          <form action={signOutAction} className="flex items-center gap-2">
            <input type="hidden" name="locale" value={locale} />
            <span className="text-zinc-700 dark:text-zinc-200">{user.name}</span>
            <button type="submit" className={pill}>
              {m.nav.logout}
            </button>
          </form>
        ) : (
          <Link
            href={
              localePath(locale, "/login") + `?next=${encodeURIComponent(localePath(locale, path))}`
            }
            className={pill}
          >
            {m.nav.login}
          </Link>
        )}
      </nav>
    </header>
  );
}
