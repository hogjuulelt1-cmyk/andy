import { describe, expect, it } from "vitest";
import { addMonthsClamped, buildInstallmentSchedule, daysBetween } from "./installments";

const sum = (xs: { amountKrw: number }[]) => xs.reduce((a, b) => a + b.amountKrw, 0);

describe("addMonthsClamped", () => {
  it("keeps the day of month and clamps at month end", () => {
    expect(addMonthsClamped("2027-01-15", 1)).toBe("2027-02-15");
    expect(addMonthsClamped("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonthsClamped("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonthsClamped("2027-11-30", 3)).toBe("2028-02-29");
  });
});

describe("buildInstallmentSchedule", () => {
  it("splits the remainder into 4 monthly charges ending ≥7 days before departure", () => {
    const plan = buildInstallmentSchedule({
      totalKrw: 1_550_000,
      depositKrw: 700_000,
      bookingDate: "2027-01-10",
      departureDate: "2027-06-19",
    });
    expect(plan.payInFull).toBe(false);
    expect(plan.remainderKrw).toBe(850_000);
    expect(plan.installments.map((i) => i.dueDate)).toEqual([
      "2027-02-09",
      "2027-03-09",
      "2027-04-09",
      "2027-05-09",
    ]);
    expect(sum(plan.installments)).toBe(850_000);
    expect(plan.installments.map((i) => i.amountKrw)).toEqual([212_500, 212_500, 212_500, 212_500]);
    for (const i of plan.installments) {
      expect(daysBetween(i.dueDate, "2027-06-19")).toBeGreaterThanOrEqual(7);
    }
  });

  it("uses fewer installments when departure is closer", () => {
    const plan = buildInstallmentSchedule({
      totalKrw: 1_000_000,
      depositKrw: 400_000,
      bookingDate: "2027-03-01",
      departureDate: "2027-06-04",
    });
    // first due 2027-03-31; 04-30 fits; 05-30 is only 5 days before → 2 charges
    expect(plan.installments.map((i) => i.dueDate)).toEqual(["2027-03-31", "2027-04-30"]);
    expect(sum(plan.installments)).toBe(600_000);
  });

  it("falls back to pay-in-full when no monthly charge fits before the cutoff", () => {
    const plan = buildInstallmentSchedule({
      totalKrw: 1_000_000,
      depositKrw: 400_000,
      bookingDate: "2027-05-20",
      departureDate: "2027-06-04",
    });
    expect(plan.payInFull).toBe(true);
    expect(plan.installments).toEqual([]);
    expect(plan.remainderKrw).toBe(600_000);
  });

  it("puts odd won on the first installments so the total matches exactly", () => {
    const plan = buildInstallmentSchedule({
      totalKrw: 1_000_003,
      depositKrw: 0,
      bookingDate: "2027-01-01",
      departureDate: "2027-12-01",
    });
    expect(plan.installments.map((i) => i.amountKrw)).toEqual([250_001, 250_001, 250_001, 250_000]);
    expect(sum(plan.installments)).toBe(1_000_003);
  });

  it("returns no installments when the deposit already covers the total", () => {
    const plan = buildInstallmentSchedule({
      totalKrw: 500_000,
      depositKrw: 500_000,
      bookingDate: "2027-01-01",
      departureDate: "2027-06-01",
    });
    expect(plan.installments).toEqual([]);
    expect(plan.payInFull).toBe(false);
  });

  it("respects maxInstallments", () => {
    const plan = buildInstallmentSchedule({
      totalKrw: 900_000,
      depositKrw: 0,
      bookingDate: "2027-01-01",
      departureDate: "2027-12-01",
      maxInstallments: 2,
    });
    expect(plan.installments).toHaveLength(2);
  });

  it("rejects bad input", () => {
    expect(() =>
      buildInstallmentSchedule({
        totalKrw: 100,
        depositKrw: 200,
        bookingDate: "2027-01-01",
        departureDate: "2027-06-01",
      }),
    ).toThrow(RangeError);
    expect(() =>
      buildInstallmentSchedule({
        totalKrw: 100,
        depositKrw: 0,
        bookingDate: "2027-07-01",
        departureDate: "2027-06-01",
      }),
    ).toThrow(RangeError);
    expect(() =>
      buildInstallmentSchedule({
        totalKrw: 100.5,
        depositKrw: 0,
        bookingDate: "2027-01-01",
        departureDate: "2027-06-01",
      }),
    ).toThrow(TypeError);
  });
});
