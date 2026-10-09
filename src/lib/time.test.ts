import { describe, it, expect } from "vitest";
import { to24HourTime, formatTimeLabel } from "./time";

describe("to24HourTime", () => {
  it("passes 24-hour values through unchanged", () => {
    expect(to24HourTime("13:30")).toBe("13:30");
    expect(to24HourTime("00:00")).toBe("00:00");
    expect(to24HourTime("23:59")).toBe("23:59");
  });

  it("converts the booking UI's 12-hour slot labels", () => {
    expect(to24HourTime("01:30 PM")).toBe("13:30");
    expect(to24HourTime("09:00 AM")).toBe("09:00");
    expect(to24HourTime("12:00 AM")).toBe("00:00");
    expect(to24HourTime("12:00 PM")).toBe("12:00");
    expect(to24HourTime("04:30 pm")).toBe("16:30");
    expect(to24HourTime("9:05 AM")).toBe("09:05");
  });

  it("rejects values the API should not accept", () => {
    expect(to24HourTime("")).toBeNull();
    expect(to24HourTime(null)).toBeNull();
    expect(to24HourTime(undefined)).toBeNull();
    expect(to24HourTime("25:00")).toBeNull();
    expect(to24HourTime("13:60")).toBeNull();
    expect(to24HourTime("1:30")).toBeNull();
    expect(to24HourTime("01:30 XM")).toBeNull();
    expect(to24HourTime("Morning (9 AM - 12 PM)")).toBeNull();
  });
});

describe("formatTimeLabel", () => {
  it("renders 24-hour storage as a 12-hour label", () => {
    expect(formatTimeLabel("13:30")).toBe("1:30 PM");
    expect(formatTimeLabel("00:15")).toBe("12:15 AM");
    expect(formatTimeLabel("12:05")).toBe("12:05 PM");
    expect(formatTimeLabel("09:00")).toBe("9:00 AM");
  });

  it("keeps legacy 12-hour rows readable", () => {
    expect(formatTimeLabel("01:30 PM")).toBe("1:30 PM");
  });

  it("returns unknown/empty input untouched", () => {
    expect(formatTimeLabel("")).toBe("");
    expect(formatTimeLabel(null)).toBe("");
    expect(formatTimeLabel("sometime soon")).toBe("sometime soon");
  });
});
