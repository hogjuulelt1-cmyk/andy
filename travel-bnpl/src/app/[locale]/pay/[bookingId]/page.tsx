import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TossCheckout } from "@/components/toss-checkout";
import { formatRange } from "@/lib/dates";
import { t } from "@/lib/format";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { cancelPendingAction, confirmMockPaymentAction } from "@/server/actions";
import { getDeparture, getPackage } from "@/server/catalog";
import { getBooking, getUser } from "@/server/session";

type Props = Readonly<{
  params: Promise<{ locale: string; bookingId: string }>;
  searchParams: Promise<{ type?: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.pay.heading} · ${m.app.name}` };
}

export default async function PayPage({ params, searchParams }: Props) {
  const { locale, bookingId } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  const user = await getUser();
  if (!user) redirect(localePath(locale, "/login"));
  const booking = await getBooking(bookingId);
  if (!booking) notFound();
  const dep = await getDeparture(booking.departureId);
  const pkg = dep && (await getPackage(dep.packageSlug, locale));
  if (!dep || !pkg) notFound();

  const { type: typeParam } = await searchParams;
  let type: "deposit" | "remainder" | "full";
  let amountKrw: number;
  if (booking.status === "pending_deposit") {
    type = typeParam === "full" || booking.remainderKrw === 0 ? "full" : "deposit";
    amountKrw = type === "full" ? booking.totalKrw : booking.depositKrw;
  } else if (booking.status === "seat_held") {
    type = "remainder";
    amountKrw = booking.remainderKrw;
  } else {
    redirect(localePath(locale, "/my"));
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path={`/pay/${bookingId}`} />
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{m.pay.heading}</h1>
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {m.pay.demoNote}
        </p>
      </section>
      <TossCheckout
        m={m.pay}
        locale={locale}
        bookingId={booking.id}
        type={type}
        amountKrw={amountKrw}
        orderName={t(m.pay.orderName, {
          pkg: pkg.title,
          date: formatRange(dep.startDate, dep.endDate, locale),
        })}
        action={confirmMockPaymentAction}
        cancelAction={cancelPendingAction}
        cancelLabel={m.pay.cancel}
      />
    </main>
  );
}
