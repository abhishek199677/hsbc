import { describe, it, expect } from "vitest";
import {
  DEFAULT_PROCTOR_CONFIG,
  ProctorSession,
  buildReport,
  classifyFrame,
  estimateHeadYawRatio,
  estimateIrisOutwardOffsets,
  evaluateReport,
  getBlendScore,
  type ProctorIncident,
} from "./proctor";

const mk = (x: number, y = 0): { x: number; y: number } => ({ x, y });

function makeLandmarks(noseX: number, rightEyeX: number, leftEyeX: number) {
  const points = Array.from({ length: 264 }, () => mk(0.5));
  points[4] = mk(noseX);
  points[33] = mk(rightEyeX);
  points[263] = mk(leftEyeX);
  return points;
}

function makeFaceLandmarks(opts: {
  rightIrisX?: number;
  leftIrisX?: number;
  rightInnerX?: number;
  rightOuterX?: number;
  leftInnerX?: number;
  leftOuterX?: number;
} = {}) {
  const {
    rightIrisX = 0.5,
    leftIrisX = 0.5,
    rightInnerX = 0.45,
    rightOuterX = 0.55,
    leftInnerX = 0.55,
    leftOuterX = 0.45,
  } = opts;
  const points = Array.from({ length: 478 }, () => mk(0.5));
  points[468] = mk(rightIrisX);
  points[473] = mk(leftIrisX);
  points[133] = mk(rightInnerX);
  points[33] = mk(rightOuterX);
  points[362] = mk(leftInnerX);
  points[263] = mk(leftOuterX);
  return points;
}

describe("estimateHeadYawRatio", () => {
  it("returns ~0.5 when facing the camera", () => {
    const ratio = estimateHeadYawRatio(makeLandmarks(0.5, 0.4, 0.6));
    expect(ratio).toBeCloseTo(0.5, 5);
  });

  it("returns < 0.35 when the head is turned", () => {
    const ratio = estimateHeadYawRatio(makeLandmarks(0.43, 0.4, 0.6));
    expect(ratio).toBeLessThan(0.35);
  });

  it("returns > 0.65 when the head is turned the other way", () => {
    const ratio = estimateHeadYawRatio(makeLandmarks(0.57, 0.4, 0.6));
    expect(ratio).toBeGreaterThan(0.65);
  });

  it("returns null for empty/too-short landmark lists", () => {
    expect(estimateHeadYawRatio(null)).toBeNull();
    expect(estimateHeadYawRatio([])).toBeNull();
  });
});

describe("estimateIrisOutwardOffsets", () => {
  it("reports ~0.5 (centered) when both irises sit mid-eye", () => {
    const { left, right } = estimateIrisOutwardOffsets(makeFaceLandmarks());
    expect(right).toBeCloseTo(0.5, 5);
    expect(left).toBeCloseTo(0.5, 5);
  });

  it("detects an outward-right glance via the right iris", () => {
    const { right } = estimateIrisOutwardOffsets(
      makeFaceLandmarks({ rightIrisX: 0.54, leftIrisX: 0.46 })
    );
    expect(right).toBeGreaterThan(0.8);
  });

  it("detects an outward-left glance via the left iris", () => {
    const { left } = estimateIrisOutwardOffsets(
      makeFaceLandmarks({ rightIrisX: 0.46, leftIrisX: 0.46 })
    );
    expect(left).toBeGreaterThan(0.8);
  });

  it("returns nulls for short landmark lists", () => {
    expect(estimateIrisOutwardOffsets(null)).toEqual({ left: null, right: null });
    expect(estimateIrisOutwardOffsets([])).toEqual({ left: null, right: null });
  });
});

describe("getBlendScore", () => {
  const cats = [
    { categoryName: "eyeLookOutLeft", score: 0.8 },
    { categoryName: "eyeBlinkRight", score: 0.9 },
  ];

  it("returns the matching score", () => {
    expect(getBlendScore(cats, "eyeLookOutLeft")).toBe(0.8);
    expect(getBlendScore(cats, "eyeBlinkRight")).toBe(0.9);
  });

  it("returns 0 for missing names or empty categories", () => {
    expect(getBlendScore(cats, "eyeLookInLeft")).toBe(0);
    expect(getBlendScore(undefined, "eyeLookOutLeft")).toBe(0);
    expect(getBlendScore([], "eyeLookOutLeft")).toBe(0);
  });
});

describe("classifyFrame", () => {
  const config = DEFAULT_PROCTOR_CONFIG;
  const base = {
    faceCount: 1,
    yawRatio: 0.5,
    gazeOutLeft: 0,
    gazeOutRight: 0,
    gazeDownLeft: 0,
    gazeDownRight: 0,
    irisOffLeft: 0,
    irisOffRight: 0,
    blinkLeft: 0,
    blinkRight: 0,
    config,
  };

  it("is null when the candidate is fine", () => {
    expect(classifyFrame(base)).toBeNull();
  });

  it("detects no face", () => {
    expect(classifyFrame({ ...base, faceCount: 0 })).toEqual({ type: "face_hidden" });
  });

  it("detects multiple faces", () => {
    expect(classifyFrame({ ...base, faceCount: 2 })).toEqual({ type: "multiple_faces" });
  });

  it("detects head turned left/right", () => {
    const left = classifyFrame({ ...base, yawRatio: 0.3 });
    expect(left?.type).toBe("look_away");
    expect(left?.detail).toContain("left");

    const right = classifyFrame({ ...base, yawRatio: 0.7 });
    expect(right?.type).toBe("look_away");
    expect(right?.detail).toContain("right");
  });

  it("detects sideways eye gaze (blendshape)", () => {
    expect(classifyFrame({ ...base, gazeOutLeft: 0.8 })?.type).toBe("look_away");
    expect(classifyFrame({ ...base, gazeOutRight: 0.8 })?.type).toBe("look_away");
  });

  it("detects sideways eye gaze from iris position", () => {
    expect(classifyFrame({ ...base, irisOffRight: 0.8 })?.type).toBe("look_away");
    expect(classifyFrame({ ...base, irisOffLeft: 0.8 })?.type).toBe("look_away");
    expect(classifyFrame({ ...base, irisOffRight: 0.2 })).toBeNull();
  });

  it("detects looking down (not at the camera)", () => {
    const down = classifyFrame({ ...base, gazeDownRight: 0.8 });
    expect(down?.type).toBe("look_away");
    expect(down?.detail).toContain("down");
    expect(classifyFrame({ ...base, gazeDownLeft: 0.2 })).toBeNull();
  });

  it("detects eyes closed", () => {
    expect(classifyFrame({ ...base, blinkLeft: 0.8, blinkRight: 0.8 })?.type).toBe("eyes_closed");
  });
});

describe("ProctorSession", () => {
  it("ignores brief glances but commits sustained look-aways", () => {
    const session = new ProctorSession(0);
    const out: { incident?: ProctorIncident } = {};

    session.tick(100, { type: "look_away" }, out);
    expect(out.incident).toBeUndefined();

    // still violating 1s later — short of the 1.2s sustain
    session.tick(1100, { type: "look_away" }, out);
    expect(out.incident).toBeUndefined();

    // sustained past 1.2s → incident committed
    session.tick(1300, { type: "look_away" }, out);
    expect(out.incident).toBeDefined();
  });

  it("requires the violation to clear before counting again (cooldown)", () => {
    const session = new ProctorSession(0);
    const out: { incident?: ProctorIncident } = {};
    session.tick(100, { type: "look_away" }, out);
    session.tick(1300, { type: "look_away" }, out);
    expect(out.incident).toBeDefined();
    const firstCount = session.getIncidents().length;

    // continuous violation after commit shouldn't double count
    session.tick(2000, { type: "look_away" }, out);
    expect(out.incident).toBeUndefined();
    expect(session.getIncidents().length).toBe(firstCount);
  });

  it("emits live 'violating' status while a violation is in progress", () => {
    const session = new ProctorSession(0);
    const status = session.tick(500, { type: "face_hidden" });
    expect(status.state).toBe("violating");
    if (status.state === "violating") expect(status.type).toBe("face_hidden");
    session.tick(900, null);
    expect(session.tick(950, null)).toEqual({ state: "ok" });
  });
});

describe("evaluateReport / buildReport", () => {
  it("passes a clean interview", () => {
    expect(evaluateReport([])).toBe("pass");
    expect(buildReport(true, 1000, []).result).toBe("pass");
  });

  it("flags a single incident as review", () => {
    const incidents = [{ type: "look_away" as const, startMs: 0, endMs: 1500 }];
    expect(evaluateReport(incidents)).toBe("review");
  });

  it("fails repeated look-aways or long totals", () => {
    const one = { type: "look_away" as const, startMs: 0, endMs: 1500 };
    expect(evaluateReport([one, one, one])).toBe("fail");

    const long = [{ type: "look_away" as const, startMs: 0, endMs: 25_000 }];
    expect(evaluateReport(long)).toBe("fail");
  });

  it("reports 'off' when proctoring was not enabled", () => {
    const report = buildReport(false, 1000, [], "no camera");
    expect(report.result).toBe("off");
    expect(report.reason).toBe("no camera");
  });

  it("tallies counts and total look-away time", () => {
    const report = buildReport(true, 5000, [
      { type: "look_away", startMs: 0, endMs: 1200 },
      { type: "look_away", startMs: 2000, endMs: 2400 },
      { type: "face_hidden", startMs: 3000, endMs: 4000 },
    ]);
    expect(report.lookAwayCount).toBe(2);
    expect(report.faceHiddenCount).toBe(1);
    expect(report.totalLookAwayMs).toBe(1600);
  });
});
