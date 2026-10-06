import { describe, expect, it } from "vitest";
import {
  addDays,
  getDeparture,
  getPackage,
  isJoinable,
  listDepartures,
  listPackages,
  seatsLeft,
} from "./catalog";

describe("catalog", () => {
  it("lists the seed packages in Korean and English with places and a route", async () => {
    const ko = await listPackages("ko");
    const en = await listPackages("en");
    expect(ko.map((p) => p.slug)).toEqual([
      "gobi-central-9d",
      "gobi-7d",
      "central-6d",
      "terelj-hustai-4d",
      "khuvsgul-6d",
    ]);
    const gobiKo = ko.find((p) => p.slug === "gobi-7d")!;
    const gobiEn = en.find((p) => p.slug === "gobi-7d")!;
    expect(gobiKo.title).toBe("남고비 6박 7일");
    expect(gobiEn.title).toBe("South Gobi 7 days");
    expect(gobiKo.itinerary[0].title).toContain("울란바토르");
    expect(gobiEn.itinerary[0].title).toBe("Arrive Ulaanbaatar");
    expect(gobiKo.itinerary[3].place.name).toBe("홍고린 엘스");
    expect(gobiKo.route).toHaveLength(7);
    expect(gobiKo.route[0].label).toBe("울란바토르");
    expect(gobiKo.hero).toBe("stars");
  });

  it("returns null for an unknown package", async () => {
    expect(await getPackage("nope", "ko")).toBeNull();
  });

  it("derives endDate from the package length and sorts departures by date", async () => {
    const deps = await listDepartures("gobi-7d");
    expect(deps.length).toBeGreaterThan(0);
    expect(deps[0].startDate).toBe("2027-05-29");
    expect(deps[0].endDate).toBe("2027-06-04"); // 7 days, 6 nights
    const dates = deps.map((d) => d.startDate);
    expect([...dates].sort()).toEqual(dates);
  });

  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2027-12-30", 3)).toBe("2028-01-02");
    expect(addDays("2027-02-27", 2)).toBe("2027-03-01");
  });

  it("seatsLeft and isJoinable follow capacity and status", async () => {
    const full = await getDeparture("gobi-2027-07-10");
    const open = await getDeparture("gobi-2027-05-29");
    expect(full && seatsLeft(full)).toBe(0);
    expect(full && isJoinable(full)).toBe(false);
    expect(open && seatsLeft(open)).toBe(4);
    expect(open?.memberIndexes).toEqual([5, 11]);
    expect(open && isJoinable(open)).toBe(true);
    expect(seatsLeft({ capacity: 6, booked: 9 })).toBe(0);
  });
});
