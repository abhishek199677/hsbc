import { describe, expect, it } from "vitest";
import {
  canTransitionSubmission,
  nextSubmissionStage,
  submissionStageLabel,
} from "@/lib/recruitment-workflow";

describe("recruitment workflow", () => {
  it("supports the complete successful hiring path", () => {
    expect(canTransitionSubmission("screening", "shortlisted")).toBe(true);
    expect(canTransitionSubmission("shortlisted", "interview-scheduled")).toBe(true);
    expect(canTransitionSubmission("interview-scheduled", "offered")).toBe(true);
    expect(canTransitionSubmission("offered", "placed")).toBe(true);
  });

  it("allows rejection before placement", () => {
    expect(canTransitionSubmission("screening", "rejected")).toBe(true);
    expect(canTransitionSubmission("shortlisted", "rejected")).toBe(true);
    expect(canTransitionSubmission("interview-scheduled", "rejected")).toBe(true);
    expect(canTransitionSubmission("offered", "rejected")).toBe(true);
  });

  it("blocks skipped and terminal transitions", () => {
    expect(canTransitionSubmission("screening", "offered")).toBe(false);
    expect(canTransitionSubmission("shortlisted", "placed")).toBe(false);
    expect(canTransitionSubmission("placed", "rejected")).toBe(false);
    expect(canTransitionSubmission("rejected", "screening")).toBe(false);
  });

  it("supports legacy submitted records as screening", () => {
    expect(submissionStageLabel("submitted")).toBe("Screening");
    expect(nextSubmissionStage("submitted")).toBe("shortlisted");
    expect(canTransitionSubmission("submitted", "shortlisted")).toBe(true);
  });
});
