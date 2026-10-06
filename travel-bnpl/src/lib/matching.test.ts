import { describe, expect, it } from "vitest";
import { groupMatch, isValidMbti, pairMatch, type TravelProfile } from "./matching";

const base: TravelProfile = {
  mbti: "ENFP",
  pace: "active",
  food: "any",
  drink: "some",
  wake: "early",
  photo: "lots",
  budget: "value",
  mix: "any",
  gender: "f",
};

describe("pairMatch", () => {
  it("is 100 for an identical profile", () => {
    expect(pairMatch(base, { ...base }).score).toBe(100);
  });
  it("drops hard on opposite pace and wake time", () => {
    const r = pairMatch(base, { ...base, pace: "relaxed", wake: "late" });
    expect(r.score).toBeLessThan(65);
    expect(r.reasons.find((x) => x.key === "pace")?.good).toBe(false);
  });
  it("korean-only vs local-only food is a conflict, 'any' is fine", () => {
    const k = { ...base, food: "korean" as const };
    expect(pairMatch(k, { ...base, food: "local" }).score).toBeLessThan(
      pairMatch(k, { ...base, food: "any" }).score,
    );
  });
  it("ignores MBTI when one side has none", () => {
    const a = pairMatch({ ...base, mbti: "" }, base);
    expect(a.score).toBe(100);
    expect(a.reasons.some((r) => r.key === "mbti")).toBe(false);
  });
  it("MBTI: shared N/S and J/P letters count more than E/I", () => {
    const sameNJ = pairMatch({ ...base, mbti: "INFP" }, base).score; // differ only E/I
    const diffNJ = pairMatch({ ...base, mbti: "ESTJ" }, base).score; // differ S/N, T/F, J/P
    expect(sameNJ).toBeGreaterThan(diffNJ);
  });
});

describe("groupMatch", () => {
  it("returns null for an empty group", () => {
    expect(groupMatch(base, [])).toBeNull();
  });
  it("averages pair scores and lists shared reasons", () => {
    const g = groupMatch(base, [base, { ...base, pace: "relaxed" }]);
    expect(g?.score).toBeGreaterThan(70);
    expect(g?.perMember).toHaveLength(2);
    expect(g?.topReasons).toContain("food");
  });
  it("flags a mixed group when the user wants same gender", () => {
    const g = groupMatch({ ...base, mix: "same" }, [{ ...base, gender: "m" }]);
    expect(g?.mixOk).toBe(false);
  });
});

describe("isValidMbti", () => {
  it("accepts the 16 types only", () => {
    expect(isValidMbti("INTJ")).toBe(true);
    expect(isValidMbti("ABCD")).toBe(false);
    expect(isValidMbti("")).toBe(false);
  });
});
