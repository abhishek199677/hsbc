import { describe, expect, it } from "vitest";
import { stripInterviewMarkers } from "./interview-markers";

describe("stripInterviewMarkers", () => {
  it("removes phase and difficulty markers from candidate-facing text", () => {
    expect(
      stripInterviewMarkers(
        "Welcome! [PHASE: warmup] [DIFFICULTY: easy]"
      )
    ).toBe("Welcome!");
  });

  it("removes combined phase and difficulty markers in one bracket", () => {
    expect(
      stripInterviewMarkers(
        "Nice to meet you. [DIFFICULTY: easy|PHASE: warmup]"
      )
    ).toBe("Nice to meet you.");
  });

  it("preserves normal text and marker-like content that is not a supported marker", () => {
    expect(
      stripInterviewMarkers(
        "Tell me about your experience. [PHASE: unknown] [INTERNAL: keep]"
      )
    ).toBe("Tell me about your experience. [PHASE: unknown] [INTERNAL: keep]");
  });
});
