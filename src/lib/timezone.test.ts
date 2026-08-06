import { describe, it, expect } from "vitest";
import { timezoneLabel } from "@/lib/timezone";

describe("timezoneLabel", () => {
  it("returns an abbreviation for known timezones", () => {
    expect(timezoneLabel("Asia/Kolkata")).toMatch(/IST|GMT/);
    expect(timezoneLabel("Europe/London")).toBeTruthy();
  });

  it("falls back to the IANA name when invalid", () => {
    expect(timezoneLabel("Not/AZone")).toBe("Not/AZone");
  });

  it("defaults to IST when empty", () => {
    expect(timezoneLabel(undefined)).toBe("IST");
    expect(timezoneLabel(null)).toBe("IST");
    expect(timezoneLabel("")).toBe("IST");
  });
});
