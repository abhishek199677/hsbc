import { describe, expect, it } from "vitest";
import { getInterviewResumeDetails } from "./interview-profile";

describe("getInterviewResumeDetails", () => {
  it("uses and trims the role and experience from the saved resume", () => {
    expect(
      getInterviewResumeDetails({
        currentRole: " AI & Data Engineer ",
        totalExperience: " 8+ years ",
      })
    ).toEqual({
      role: "AI & Data Engineer",
      experience: "8+ years",
      ready: true,
    });
  });

  it("does not mark the interview ready when either resume detail is missing", () => {
    expect(
      getInterviewResumeDetails({
        currentRole: "AI & Data Engineer",
        totalExperience: null,
      })
    ).toEqual({
      role: "AI & Data Engineer",
      experience: null,
      ready: false,
    });
  });

  it("does not invent role or experience values for an incomplete resume", () => {
    expect(
      getInterviewResumeDetails({
        currentRole: " ",
        totalExperience: "",
      })
    ).toEqual({
      role: null,
      experience: null,
      ready: false,
    });
  });
});
