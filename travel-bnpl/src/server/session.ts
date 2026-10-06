/**
 * Demo session + demo bookings, stored in cookies.
 *
 * This is the mock layer for the Vercel preview: no database, no real auth,
 * no real Toss. Everything a user does lives in their own cookies. The
 * function signatures mirror what the Prisma-backed versions will expose so
 * pages do not change when the real backend lands.
 */
import "server-only";
import { cookies } from "next/headers";

export type DemoUser = {
  id: string;
  name: string;
  provider: "kakao" | "naver";
};

export type BookingStatus = "pending_deposit" | "seat_held" | "paid_in_full";
export type PaymentMethod = "card" | "tosspay" | "kakaopay" | "naverpay";

export type DemoBooking = {
  id: string;
  departureId: string;
  status: BookingStatus;
  totalKrw: number;
  depositKrw: number;
  remainderKrw: number;
  /** YYYY-MM-DD in Asia/Seoul */
  remainderDue: string;
  /** YYYY-MM-DD in Asia/Seoul */
  bookedOn: string;
  depositMethod?: PaymentMethod;
  remainderMethod?: PaymentMethod;
  /** 0 = lump sum, 2..6 = card installment months chosen at Toss */
  remainderInstallmentMonths?: number;
};

const USER_COOKIE = "demo_user";
const BOOKINGS_COOKIE = "demo_bookings";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function parse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getUser(): Promise<DemoUser | null> {
  const jar = await cookies();
  return parse<DemoUser | null>(jar.get(USER_COOKIE)?.value, null);
}

export async function setUser(user: DemoUser | null): Promise<void> {
  const jar = await cookies();
  if (user) jar.set(USER_COOKIE, JSON.stringify(user), COOKIE_OPTS);
  else jar.delete(USER_COOKIE);
}

export async function listBookings(): Promise<DemoBooking[]> {
  const jar = await cookies();
  return parse<DemoBooking[]>(jar.get(BOOKINGS_COOKIE)?.value, []);
}

export async function saveBookings(bookings: DemoBooking[]): Promise<void> {
  const jar = await cookies();
  jar.set(BOOKINGS_COOKIE, JSON.stringify(bookings), COOKIE_OPTS);
}

export async function getBooking(id: string): Promise<DemoBooking | null> {
  return (await listBookings()).find((b) => b.id === id) ?? null;
}

export async function findBookingForDeparture(departureId: string): Promise<DemoBooking | null> {
  return (await listBookings()).find((b) => b.departureId === departureId) ?? null;
}

export function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---- travel profile (matching) ----
import type { TravelProfile } from "@/lib/matching";

const PROFILE_COOKIE = "demo_profile";

export async function getProfile(): Promise<TravelProfile | null> {
  const jar = await cookies();
  return parse<TravelProfile | null>(jar.get(PROFILE_COOKIE)?.value, null);
}

export async function setProfile(profile: TravelProfile | null): Promise<void> {
  const jar = await cookies();
  if (profile) jar.set(PROFILE_COOKIE, JSON.stringify(profile), COOKIE_OPTS);
  else jar.delete(PROFILE_COOKIE);
}
