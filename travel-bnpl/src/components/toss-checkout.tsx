"use client";

import { useState } from "react";
import { t } from "@/lib/format";
import type { Messages } from "@/lib/i18n";
import { formatKrw } from "@/lib/money";

type Props = {
  m: Messages["pay"];
  locale: string;
  bookingId: string;
  type: "deposit" | "remainder" | "full";
  amountKrw: number;
  orderName: string;
  action: (form: FormData) => Promise<void>;
  cancelAction: (form: FormData) => Promise<void>;
  cancelLabel: string;
};

const METHODS = ["card", "tosspay", "kakaopay", "naverpay"] as const;
const MONTHS = [0, 2, 3, 4, 5, 6] as const;

/**
 * Looks like the Toss Payments widget (결제수단 + 할부 선택) so the demo flow
 * feels real. In production this component is replaced by the actual
 * @tosspayments/tosspayments-sdk widget; the form fields stay the same.
 */
export function TossCheckout({
  m,
  locale,
  bookingId,
  type,
  amountKrw,
  orderName,
  action,
  cancelAction,
  cancelLabel,
}: Props) {
  const [method, setMethod] = useState<(typeof METHODS)[number]>("card");
  const [months, setMonths] = useState<number>(0);
  const installmentsAllowed = method === "card" && type !== "deposit";

  const typeLabel = { deposit: m.deposit, remainder: m.remainder, full: m.full }[type];

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="months" value={installmentsAllowed ? months : 0} />

      <section className="rounded-2xl border border-[#3182F6]/30 bg-[#3182F6]/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#3182F6]">toss payments</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{typeLabel}</span>
        </div>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">{orderName}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{formatKrw(amountKrw)}</p>
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{m.method}</legend>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((k) => (
            <label
              key={k}
              className={
                "flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium " +
                (method === k
                  ? "border-[#3182F6] bg-[#3182F6]/10 text-[#1b64da] dark:text-[#8ab4f8]"
                  : "border-zinc-200 dark:border-zinc-800")
              }
            >
              <input
                type="radio"
                name="method-ui"
                value={k}
                checked={method === k}
                onChange={() => setMethod(k)}
                className="sr-only"
              />
              {m[k]}
            </label>
          ))}
        </div>
      </fieldset>

      {installmentsAllowed && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold">{m.installment}</legend>
          <select
            id="installment-months"
            aria-label={m.installment}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          >
            {MONTHS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? m.lump : t(m.months, { n })}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.installmentNote}</p>
        </fieldset>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          className="rounded-full bg-[#3182F6] px-5 py-3 text-base font-semibold text-white"
        >
          {t(m.pay, { amount: formatKrw(amountKrw) })}
        </button>
        <button
          type="submit"
          formAction={cancelAction}
          formNoValidate
          className="rounded-full px-5 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {cancelLabel}
        </button>
      </div>
    </form>
  );
}
