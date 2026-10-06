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
  it("lists the three seed packages in Korean and English", async () => {
    const ko = await listPackages("ko");
    const en = await listPackages("en");
    expect(ko.map((p) => p.slug)).toEqual(["gobi-7d", "terelj-hustai-4d", "khuvsgul-6d"]);
    expect(ko[0].title).toBe("고비 사막 7일");
    expect(en[0].title).toBe("Gobi 7 days");
    expect(ko[0].itinerary[0].title).toContain("울란바토르");
    expect(en[0].itinerary[0].title).toBe("Arrive Ulaanbaatar");
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
    expect(open && isJoinable(open)).toBe(true);
    expect(seatsLeft({ capacity: 6, booked: 9 })).toBe(0);
  });
});
