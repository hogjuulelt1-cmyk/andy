/**
 * Mock group members and chat for the demo. Deterministic per departure so
 * the same people show up on every visit. Replaced by real bookings + the
 * ChatMessage table once the database exists.
 */
import type { Locale } from "@/lib/i18n";

type Person = { name: string; intro: { ko: string; en: string }; gender: "f" | "m"; age: string };

const POOL: Person[] = [
  {
    name: "지민",
    intro: {
      ko: "사진 찍는 거 좋아해요. 별 사진 꼭 찍고 싶어요",
      en: "Into photography, want to shoot the stars",
    },
    gender: "f",
    age: "20대",
  },
  {
    name: "민준",
    intro: { ko: "직장인, 휴가 맞춰서 갑니다. 운전 가능", en: "Office worker on leave, can drive" },
    gender: "m",
    age: "30대",
  },
  {
    name: "서연",
    intro: { ko: "혼자 여행 많이 다녔어요. 조용한 편", en: "Solo traveller, on the quiet side" },
    gender: "f",
    age: "20대",
  },
  {
    name: "도윤",
    intro: { ko: "캠핑 좋아함. 요리 담당 가능", en: "Camping fan, happy to cook" },
    gender: "m",
    age: "20대",
  },
  {
    name: "하은",
    intro: { ko: "대학생. 몽골 처음이에요!", en: "Student. First time in Mongolia!" },
    gender: "f",
    age: "20대",
  },
  {
    name: "수아",
    intro: { ko: "승마 꼭 해보고 싶어요", en: "Really want to try horse riding" },
    gender: "f",
    age: "30대",
  },
];

export type Member = {
  id: string;
  name: string;
  intro: string;
  gender: "f" | "m";
  age: string;
  isYou?: boolean;
};

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function mockMembers(departureId: string, count: number, locale: Locale): Member[] {
  const start = hash(departureId) % POOL.length;
  return Array.from({ length: Math.min(count, POOL.length) }, (_, i) => {
    const p = POOL[(start + i) % POOL.length];
    return {
      id: `${departureId}-${i}`,
      name: p.name,
      intro: p.intro[locale],
      gender: p.gender,
      age: p.age,
    };
  });
}

export type ChatMessage = { id: string; author: string; body: string; at: string };

export function mockChat(departureId: string, members: Member[], locale: Locale): ChatMessage[] {
  if (members.length === 0) return [];
  const lines = {
    ko: [
      "안녕하세요! 잘 부탁드려요 🙌",
      "혹시 유심 어디서 사세요? 공항에서 사면 되나요?",
      "저는 eSIM 미리 샀어요. 체크리스트에 링크 있어요",
      "별 보려면 삼각대 챙기는 게 좋대요",
    ],
    en: [
      "Hi everyone! Looking forward to it 🙌",
      "Where do you buy a SIM? At the airport?",
      "I got an eSIM in advance, link is in the checklist",
      "Bring a tripod for the stars, apparently",
    ],
  }[locale];
  return lines.slice(0, Math.min(lines.length, members.length + 1)).map((body, i) => ({
    id: `${departureId}-m${i}`,
    author: members[i % members.length].name,
    body,
    at: `${9 + i}:${String((i * 17) % 60).padStart(2, "0")}`,
  }));
}
