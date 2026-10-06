"use server";

import { redirect } from "next/navigation";
import { defaultLocale, isLocale, localePath, type Locale } from "@/lib/i18n";
import { remainderDueDate } from "@/lib/installments";
import { assertKrw } from "@/lib/money";
import { OPTIONS, isValidMbti, type QuestionKey, type TravelProfile } from "@/lib/matching";
import { getDeparture, isJoinable } from "@/server/catalog";
import {
  findBookingForDeparture,
  getBooking,
  getUser,
  listBookings,
  newId,
  saveBookings,
  setProfile,
  setUser,
  todayInSeoul,
  type DemoBooking,
  type PaymentMethod,
} from "@/server/session";

function localeOf(form: FormData): Locale {
  const l = String(form.get("locale") ?? defaultLocale);
  return isLocale(l) ? l : defaultLocale;
}

/** Only allow redirects inside the app. */
function safeNext(form: FormData, fallback: string): string {
  const next = String(form.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function signInAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const provider = form.get("provider") === "naver" ? "naver" : "kakao";
  const name = String(form.get("name") ?? "").trim();
  if (!name) redirect(localePath(locale, "/login") + "?error=name");
  await setUser({ id: newId("u"), name: name.slice(0, 40), provider });
  redirect(safeNext(form, localePath(locale, "/my")));
}

export async function signOutAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  await setUser(null);
  redirect(localePath(locale, "/"));
}

/** Create a pending booking for a departure and send the user to the mock Toss checkout. */
export async function startBookingAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const departureId = String(form.get("departureId") ?? "");
  const user = await getUser();
  if (!user) {
    redirect(
      localePath(locale, "/login") +
        `?next=${encodeURIComponent(localePath(locale, `/departures/${departureId}/join`))}`,
    );
  }
  const dep = await getDeparture(departureId);
  if (!dep || !isJoinable(dep)) redirect(localePath(locale, `/departures/${departureId}/join`));

  const existing = await findBookingForDeparture(departureId);
  if (existing) {
    redirect(
      existing.status === "pending_deposit"
        ? localePath(locale, `/pay/${existing.id}`) + "?type=deposit"
        : localePath(locale, "/my"),
    );
  }

  const bookedOn = todayInSeoul();
  const { dueDate, payWithDeposit } = remainderDueDate(bookedOn, dep.startDate);
  const remainderKrw = assertKrw(dep.priceKrw - dep.depositKrw);
  const booking: DemoBooking = {
    id: newId("bk"),
    departureId,
    status: "pending_deposit",
    totalKrw: dep.priceKrw,
    depositKrw: dep.depositKrw,
    remainderKrw,
    remainderDue: dueDate,
    bookedOn,
  };
  await saveBookings([...(await listBookings()), booking]);
  redirect(
    localePath(locale, `/pay/${booking.id}`) + `?type=${payWithDeposit ? "full" : "deposit"}`,
  );
}

const METHODS: PaymentMethod[] = ["card", "tosspay", "kakaopay", "naverpay"];

/**
 * Mock Toss "confirm": in the real app this is the server-side
 * POST /v1/payments/confirm after the widget redirects back, followed by the
 * webhook. Here it just flips the booking status.
 */
export async function confirmMockPaymentAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const bookingId = String(form.get("bookingId") ?? "");
  const type = String(form.get("type") ?? "deposit");
  const methodRaw = String(form.get("method") ?? "card");
  const method = (METHODS as string[]).includes(methodRaw) ? (methodRaw as PaymentMethod) : "card";
  const months = Math.max(0, Math.min(12, Number(form.get("months") ?? 0) || 0));

  const bookings = await listBookings();
  const i = bookings.findIndex((b) => b.id === bookingId);
  if (i < 0) redirect(localePath(locale, "/my"));
  const b = bookings[i];

  if (type === "remainder") {
    if (b.status !== "seat_held") redirect(localePath(locale, "/my"));
    bookings[i] = {
      ...b,
      status: "paid_in_full",
      remainderMethod: method,
      remainderInstallmentMonths: method === "card" ? months : 0,
    };
  } else {
    if (b.status !== "pending_deposit") redirect(localePath(locale, "/my"));
    const full = type === "full" || b.remainderKrw === 0;
    bookings[i] = {
      ...b,
      status: full ? "paid_in_full" : "seat_held",
      depositMethod: method,
      ...(full ? { remainderMethod: method, remainderInstallmentMonths: months } : {}),
    };
  }
  await saveBookings(bookings);
  redirect(localePath(locale, "/my") + `?paid=${bookingId}`);
}

export async function cancelPendingAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const bookingId = String(form.get("bookingId") ?? "");
  const b = await getBooking(bookingId);
  if (b && b.status === "pending_deposit") {
    await saveBookings((await listBookings()).filter((x) => x.id !== bookingId));
  }
  redirect(localePath(locale, b ? `/departures/${b.departureId}/join` : "/my"));
}

export async function saveProfileAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const pickOpt = <K extends QuestionKey>(k: K): TravelProfile[K] => {
    const v = String(form.get(k) ?? "");
    return ((OPTIONS[k] as readonly string[]).includes(v) ? v : OPTIONS[k][0]) as TravelProfile[K];
  };
  const mbtiRaw = String(form.get("mbti") ?? "")
    .trim()
    .toUpperCase();
  const genderRaw = String(form.get("gender") ?? "f");
  const profile: TravelProfile = {
    mbti: isValidMbti(mbtiRaw) ? mbtiRaw : "",
    pace: pickOpt("pace"),
    food: pickOpt("food"),
    drink: pickOpt("drink"),
    wake: pickOpt("wake"),
    photo: pickOpt("photo"),
    budget: pickOpt("budget"),
    mix: pickOpt("mix"),
    gender: genderRaw === "m" ? "m" : genderRaw === "other" ? "other" : "f",
  };
  await setProfile(profile);
  redirect(localePath(locale, "/match") + "?saved=1");
}

export async function clearProfileAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  await setProfile(null);
  redirect(localePath(locale, "/match"));
}
