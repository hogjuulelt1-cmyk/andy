import type { Locale } from "./i18n";

const USER_TZ = "Asia/Seoul";

function parseIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  // Noon UTC keeps the calendar day stable in Asia/Seoul (UTC+9).
  return new Date(Date.UTC(y, m - 1, d, 12));
}

const localeTag: Record<Locale, string> = { ko: "ko-KR", en: "en-US" };

/** "6월 19일 (토)" / "Sat, Jun 19" */
export function formatDay(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag[locale], {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: USER_TZ,
  }).format(parseIsoDate(isoDate));
}

/** "2027년 6월" / "June 2027" */
export function formatMonth(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag[locale], {
    year: "numeric",
    month: "long",
    timeZone: USER_TZ,
  }).format(parseIsoDate(isoDate));
}

/** "6월 19일 (토) – 6월 25일 (금)" */
export function formatRange(startIso: string, endIso: string, locale: Locale): string {
  return `${formatDay(startIso, locale)} – ${formatDay(endIso, locale)}`;
}

/** YYYY-MM for grouping. */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}
