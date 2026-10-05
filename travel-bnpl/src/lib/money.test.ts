import { describe, expect, it } from "vitest";
import { assertKrw, formatKrw, formatKrwSign, mntToKrw, percentOfKrw, splitKrw } from "./money";

describe("assertKrw", () => {
  it("accepts non-negative integers", () => {
    expect(assertKrw(0)).toBe(0);
    expect(assertKrw(1_200_000)).toBe(1_200_000);
  });
  it("rejects floats and negatives", () => {
    expect(() => assertKrw(1.5)).toThrow(TypeError);
    expect(() => assertKrw(-1)).toThrow(RangeError);
    expect(() => assertKrw(Number.NaN)).toThrow(TypeError);
  });
});

describe("formatKrw", () => {
  it("formats with Korean thousands separators and 원", () => {
    expect(formatKrw(1_200_000)).toBe("1,200,000원");
    expect(formatKrw(0)).toBe("0원");
    expect(formatKrwSign(850_000)).toBe("₩850,000");
  });
});

describe("splitKrw", () => {
  it("splits evenly when divisible", () => {
    expect(splitKrw(900_000, 3)).toEqual([300_000, 300_000, 300_000]);
  });
  it("puts the remainder on the first installments and sums exactly", () => {
    const parts = splitKrw(1_000_001, 4);
    expect(parts).toEqual([250_001, 250_000, 250_000, 250_000]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1_000_001);
  });
  it("handles a single part", () => {
    expect(splitKrw(123, 1)).toEqual([123]);
  });
  it("rejects bad input", () => {
    expect(() => splitKrw(100, 0)).toThrow(RangeError);
    expect(() => splitKrw(100.5, 2)).toThrow(TypeError);
  });
});

describe("percentOfKrw", () => {
  it("rounds to whole won", () => {
    expect(percentOfKrw(1_500_000, 30)).toBe(450_000);
    expect(percentOfKrw(999, 33.3)).toBe(333);
  });
});

describe("mntToKrw", () => {
  it("converts and rounds", () => {
    // 3,000,000 ₮ at 0.38 KRW/MNT
    expect(mntToKrw(3_000_000, 0.38)).toBe(1_140_000);
  });
  it("rejects non-positive rates", () => {
    expect(() => mntToKrw(1000, 0)).toThrow(RangeError);
  });
});
