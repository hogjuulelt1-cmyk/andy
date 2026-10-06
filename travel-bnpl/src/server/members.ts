/**
 * Mock travellers for the demo. Departures in seed/departures.json reference
 * them by index. Replaced by real users + bookings once the database exists.
 */
import type { Locale } from "@/lib/i18n";
import type { TravelProfile } from "@/lib/matching";

type Person = {
  name: string;
  intro: { ko: string; en: string };
  age: string;
  profile: TravelProfile;
};

const p = (
  mbti: string,
  pace: TravelProfile["pace"],
  food: TravelProfile["food"],
  drink: TravelProfile["drink"],
  wake: TravelProfile["wake"],
  photo: TravelProfile["photo"],
  budget: TravelProfile["budget"],
  gender: TravelProfile["gender"],
  mix: TravelProfile["mix"] = "any",
): TravelProfile => ({ mbti, pace, food, drink, wake, photo, budget, mix, gender });

export const POOL: Person[] = [
  {
    name: "지민",
    intro: {
      ko: "사진 찍는 거 좋아해요. 별 사진 꼭 찍고 싶어요",
      en: "Into photography, want to shoot the stars",
    },
    age: "20대",
    profile: p("ENFP", "active", "any", "some", "late", "lots", "value", "f"),
  },
  {
    name: "민준",
    intro: { ko: "직장인, 휴가 맞춰서 갑니다. 운전 가능", en: "Office worker on leave, can drive" },
    age: "30대",
    profile: p("ISTJ", "relaxed", "korean", "yes", "early", "some", "comfort", "m"),
  },
  {
    name: "서연",
    intro: { ko: "혼자 여행 많이 다녔어요. 조용한 편", en: "Solo traveller, on the quiet side" },
    age: "20대",
    profile: p("INFJ", "relaxed", "local", "no", "early", "some", "value", "f"),
  },
  {
    name: "도윤",
    intro: { ko: "캠핑 좋아함. 요리 담당 가능", en: "Camping fan, happy to cook" },
    age: "20대",
    profile: p("ESTP", "active", "any", "yes", "early", "some", "value", "m"),
  },
  {
    name: "하은",
    intro: { ko: "대학생. 몽골 처음이에요!", en: "Student. First time in Mongolia!" },
    age: "20대",
    profile: p("ESFP", "active", "korean", "some", "late", "lots", "value", "f"),
  },
  {
    name: "수아",
    intro: { ko: "승마 꼭 해보고 싶어요", en: "Really want to try horse riding" },
    age: "30대",
    profile: p("INFP", "relaxed", "any", "no", "early", "lots", "comfort", "f"),
  },
  {
    name: "준호",
    intro: { ko: "트레킹 좋아해요. 일찍 일어나는 편", en: "Hiker, early riser" },
    age: "30대",
    profile: p("INTJ", "active", "local", "some", "early", "some", "value", "m"),
  },
  {
    name: "예린",
    intro: { ko: "맛집 탐방러. 현지 음식 다 먹어봐요", en: "Foodie, will try everything" },
    age: "20대",
    profile: p("ENTP", "active", "local", "yes", "late", "lots", "value", "f"),
  },
  {
    name: "현우",
    intro: { ko: "느긋하게 풍경 보는 게 좋아요", en: "Slow travel, scenery first" },
    age: "30대",
    profile: p("ISFJ", "relaxed", "korean", "no", "early", "some", "comfort", "m"),
  },
  {
    name: "소율",
    intro: { ko: "인스타 릴스 찍어요 📸", en: "Makes reels 📸" },
    age: "20대",
    profile: p("ESFJ", "active", "any", "some", "late", "lots", "comfort", "f"),
  },
  {
    name: "태양",
    intro: {
      ko: "별 보러 갑니다. 천체 사진 장비 있어요",
      en: "Going for the stars, brings astro gear",
    },
    age: "30대",
    profile: p("INTP", "relaxed", "any", "no", "late", "lots", "value", "m"),
  },
  {
    name: "유나",
    intro: {
      ko: "여자끼리 가고 싶어요. 승마·온천 기대",
      en: "Prefers a women-only group. Horses and hot springs",
    },
    age: "20대",
    profile: p("ISFP", "relaxed", "korean", "some", "early", "lots", "comfort", "f", "same"),
  },
];

export type Member = {
  id: string;
  index: number;
  name: string;
  intro: string;
  age: string;
  gender: TravelProfile["gender"];
  profile: TravelProfile;
  isYou?: boolean;
};

export function membersOf(departureId: string, indexes: number[], locale: Locale): Member[] {
  return indexes
    .filter((i) => i >= 0 && i < POOL.length)
    .map((i) => {
      const q = POOL[i];
      return {
        id: `${departureId}-${i}`,
        index: i,
        name: q.name,
        intro: q.intro[locale],
        age: q.age,
        gender: q.profile.gender,
        profile: q.profile,
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
