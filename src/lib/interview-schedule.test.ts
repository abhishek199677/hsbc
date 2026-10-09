import { describe, expect, it } from "vitest";
import { getInterviewDateLabels } from "./interview-schedule";

describe("getInterviewDateLabels", () => {
  it("formats the actual selected day instead of the first of the month", () => {
    expect(getInterviewDateLabels(2026, 9, 9)).toEqual({
      long: "Friday, October 9, 2026",
      short: "Fri, Oct 9, 2026",
    });
  });
});
