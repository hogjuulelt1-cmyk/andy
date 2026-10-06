/**
 * Companion matching: a short questionnaire → a travel profile → a
 * compatibility score against other travellers and whole departure groups.
 *
 * Pure functions, no I/O. The weights are a product guess (see
 * docs/product-spec.md); tune them once real groups give feedback.
 */

export type Mbti = string; // four letters, e.g. "ENFP"; "" when unknown

export type TravelProfile = {
  mbti: Mbti;
  /** 활동적 vs 느긋 */
  pace: "active" | "relaxed";
  /** 한식 필요 / 현지식 OK / 뭐든 */
  food: "korean" | "local" | "any";
  drink: "yes" | "some" | "no";
  wake: "early" | "late";
  /** 사진이 여행의 큰 부분인가 */
  photo: "lots" | "some";
  budget: "value" | "comfort";
  /** 함께 가고 싶은 성별 구성 */
  mix: "any" | "same";
  gender: "f" | "m" | "other";
};

export const QUESTION_KEYS = ["pace", "food", "drink", "wake", "photo", "budget", "mix"] as const;
export type QuestionKey = (typeof QUESTION_KEYS)[number];

export const OPTIONS: Record<QuestionKey, readonly string[]> = {
  pace: ["active", "relaxed"],
  food: ["korean", "local", "any"],
  drink: ["yes", "some", "no"],
  wake: ["early", "late"],
  photo: ["lots", "some"],
  budget: ["value", "comfort"],
  mix: ["any", "same"],
};

export type MatchReason = { key: QuestionKey | "mbti"; good: boolean };

export type PairMatch = { score: number; reasons: MatchReason[] };

const W = { pace: 3, food: 2, wake: 2, drink: 1, photo: 1, budget: 1, mbti: 2 };
const MAX = W.pace + W.food + W.wake + W.drink + W.photo + W.budget + W.mbti;

function foodCompat(a: TravelProfile["food"], b: TravelProfile["food"]): number {
  if (a === b) return 1;
  if (a === "any" || b === "any") return 0.75;
  return 0; // korean vs local: one of them eats unhappily
}

function drinkCompat(a: TravelProfile["drink"], b: TravelProfile["drink"]): number {
  if (a === b) return 1;
  if (a === "some" || b === "some") return 0.6;
  return 0; // yes vs no
}

/** Letters that matter for travelling together: S/N (plan vs vibe), J/P (schedule vs flow). E/I mixes are fine. */
function mbtiCompat(a: Mbti, b: Mbti): number | null {
  if (a.length !== 4 || b.length !== 4) return null;
  let s = 0;
  if (a[1] === b[1]) s += 0.4;
  if (a[3] === b[3]) s += 0.4;
  if (a[2] === b[2]) s += 0.2;
  return s;
}

export function pairMatch(a: TravelProfile, b: TravelProfile): PairMatch {
  const reasons: MatchReason[] = [];
  let total = 0;
  let max = MAX;

  const add = (key: QuestionKey | "mbti", v: number, w: number) => {
    total += v * w;
    reasons.push({ key, good: v >= 0.75 });
  };

  add("pace", a.pace === b.pace ? 1 : 0, W.pace);
  add("food", foodCompat(a.food, b.food), W.food);
  add("wake", a.wake === b.wake ? 1 : 0, W.wake);
  add("drink", drinkCompat(a.drink, b.drink), W.drink);
  add("photo", a.photo === b.photo ? 1 : 0.5, W.photo);
  add("budget", a.budget === b.budget ? 1 : 0.5, W.budget);
  const mb = mbtiCompat(a.mbti, b.mbti);
  if (mb === null) max -= W.mbti;
  else add("mbti", mb, W.mbti);

  return { score: Math.round((total / max) * 100), reasons };
}

export type GroupMatch = {
  score: number;
  /** Mean of pair scores; 0 members → null */
  perMember: { index: number; score: number }[];
  /** Best reasons across the group (keys where most pairs agreed) */
  topReasons: (QuestionKey | "mbti")[];
  /** False when the user wants a same-gender group and someone differs. */
  mixOk: boolean;
};

export function groupMatch(me: TravelProfile, members: TravelProfile[]): GroupMatch | null {
  if (members.length === 0) return null;
  const pairs = members.map((m, index) => ({ index, ...pairMatch(me, m) }));
  const score = Math.round(pairs.reduce((s, p) => s + p.score, 0) / pairs.length);
  const agree = new Map<QuestionKey | "mbti", number>();
  for (const p of pairs)
    for (const r of p.reasons) if (r.good) agree.set(r.key, (agree.get(r.key) ?? 0) + 1);
  const topReasons = [...agree.entries()]
    .filter(([, n]) => n >= Math.ceil(pairs.length / 2))
    .sort((x, y) => y[1] - x[1])
    .map(([k]) => k)
    .slice(0, 3);
  const mixOk = me.mix === "any" || members.every((m) => m.gender === me.gender);
  return {
    score,
    perMember: pairs.map((p) => ({ index: p.index, score: p.score })),
    topReasons,
    mixOk,
  };
}

export function isValidMbti(s: string): boolean {
  return /^[EI][SN][TF][JP]$/.test(s);
}
