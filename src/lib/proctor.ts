// Client-side proctoring (anti-cheating) for the AI video interview.
//
// Detects malpractice — turning the head, looking sideways/away from the
// screen, covering the face, or a second person entering the frame — using
// MediaPipe's FaceLandmarker. Violations sustained for a configurable time are
// committed as incidents, surfaced live through `onStatus`, and summarized in a
// `ProctoringReport` that gets saved with the interview and shown to admins.
//
// The MediaPipe runtime is loaded lazily (dynamic import) so this module can
// also be imported by Node (tests) for its pure helpers without touching wasm.

// ---------------------------------------------------------------- types ---

export type ViolationType = "look_away" | "face_hidden" | "multiple_faces" | "eyes_closed";

export interface ProctorIncident {
  type: ViolationType;
  /** ms relative to proctor start */
  startMs: number;
  /** ms relative to proctor start */
  endMs: number;
  detail?: string;
}

export type ProctorStatus =
  | { state: "ok" }
  | { state: "violating"; type: ViolationType; sinceMs: number; detail?: string }
  | { state: "off" };

export interface ProctoringReport {
  enabled: boolean;
  /** set when proctoring could not start (e.g. no camera / model load failed) */
  reason?: string;
  durationMs: number;
  incidents: ProctorIncident[];
  lookAwayCount: number;
  faceHiddenCount: number;
  multipleFacesCount: number;
  eyesClosedCount: number;
  totalLookAwayMs: number;
  result: "pass" | "review" | "fail" | "off";
}

export interface ProctorConfig {
  /** continuous violation time (ms) before an incident is committed */
  sustainMs?: number;
  /** minimum gap (ms) before the same violation type can be committed again */
  cooldownMs?: number;
  /** head yaw ratio below/above this is considered "turned" (0.5 = facing camera) */
  yawMin?: number;
  yawMax?: number;
  /** eyeLookOut blendshape score above this means eyes looking sideways */
  gazeOutThreshold?: number;
  /** iris excursion (0..1) toward the outer eye corner that counts as a sideways glance */
  irisOutThreshold?: number;
  /** eyeLookDown blendshape score above this means looking down/away */
  gazeDownThreshold?: number;
  /** sustain (ms) before eyes-closed is committed */
  eyesClosedSustainMs?: number;
  /** sustain (ms) before face-hidden is committed */
  faceHiddenSustainMs?: number;
  /** how often (ms) to sample the video frame */
  sampleMs?: number;
}

export const DEFAULT_PROCTOR_CONFIG: Required<ProctorConfig> = {
  sustainMs: 1200,
  cooldownMs: 2500,
  yawMin: 0.35,
  yawMax: 0.65,
  gazeOutThreshold: 0.45,
  irisOutThreshold: 0.5,
  gazeDownThreshold: 0.45,
  eyesClosedSustainMs: 3000,
  faceHiddenSustainMs: 2500,
  sampleMs: 100,
};

// -------------------------------------------------------- pure helpers ----

export interface Point {
  x: number;
  y: number;
  z?: number;
}

/** MediaPipe face-mesh landmark indices used by the heuristics. */
export const LANDMARK = {
  noseTip: 4,
  rightEyeOuter: 33,
  rightEyeInner: 133,
  leftEyeInner: 362,
  leftEyeOuter: 263,
  rightIrisCenter: 468,
  leftIrisCenter: 473,
} as const;

/**
 * Estimate head yaw from landmarks as a ratio along the eye line.
 * ~0.5 means facing the camera; lower = head turned to the subject's right,
 * higher = head turned to the subject's left. Returns null if unusable.
 */
export function estimateHeadYawRatio(landmarks: Point[] | null | undefined): number | null {
  if (!landmarks || landmarks.length < 264) return null;
  const nose = landmarks[LANDMARK.noseTip];
  const rightEye = landmarks[LANDMARK.rightEyeOuter];
  const leftEye = landmarks[LANDMARK.leftEyeOuter];
  if (!nose || !rightEye || !leftEye) return null;
  const span = leftEye.x - rightEye.x;
  if (!Number.isFinite(span) || Math.abs(span) < 1e-4) return null;
  return (nose.x - rightEye.x) / span;
}

export interface IrisOutwardOffsets {
  /** 0..1 — 0 = iris at the inner (nose) corner, 1 = at the outer (temple) corner */
  left: number | null;
  right: number | null;
}

/**
 * Horizontal iris position within each eye, normalized so that higher values
 * mean the eye is turned outward (toward the temple, i.e. away from the
 * other eye / off-screen). ~0.5 is centered; values well above ~0.5 are a
 * deliberate sideways glance. More reliable than the eyeLookOut blendshapes.
 * Returns nulls when the iris/eye landmarks are unavailable.
 */
export function estimateIrisOutwardOffsets(
  landmarks: Point[] | null | undefined
): IrisOutwardOffsets {
  if (!landmarks || landmarks.length < LANDMARK.leftIrisCenter + 1) {
    return { left: null, right: null };
  }
  const rightIris = landmarks[LANDMARK.rightIrisCenter];
  const rightInner = landmarks[LANDMARK.rightEyeInner];
  const rightOuter = landmarks[LANDMARK.rightEyeOuter];
  const leftIris = landmarks[LANDMARK.leftIrisCenter];
  const leftInner = landmarks[LANDMARK.leftEyeInner];
  const leftOuter = landmarks[LANDMARK.leftEyeOuter];

  const spanR = rightOuter.x - rightInner.x;
  const spanL = leftInner.x - leftOuter.x;
  const right =
    Number.isFinite(spanR) && Math.abs(spanR) > 1e-4
      ? (rightIris.x - rightInner.x) / spanR
      : null;
  const left =
    Number.isFinite(spanL) && Math.abs(spanL) > 1e-4
      ? (leftInner.x - leftIris.x) / spanL
      : null;
  return { left, right };
}

export interface BlendCategory {
  categoryName: string;
  score: number;
}

/** Look up a blendshape score (0..1) by name, defaulting to 0. */
export function getBlendScore(
  categories: BlendCategory[] | null | undefined,
  name: string
): number {
  if (!categories) return 0;
  const found = categories.find((c) => c.categoryName === name);
  return found && Number.isFinite(found.score) ? found.score : 0;
}

export interface FrameSignals {
  faceCount: number;
  yawRatio: number | null;
  gazeOutLeft: number;
  gazeOutRight: number;
  gazeDownLeft: number;
  gazeDownRight: number;
  irisOffLeft: number;
  irisOffRight: number;
  blinkLeft: number;
  blinkRight: number;
  config: Required<ProctorConfig>;
}

/** Classify one sampled frame into a violation type, or null when OK. */
export function classifyFrame(signals: FrameSignals): { type: ViolationType; detail?: string } | null {
  const {
    faceCount,
    yawRatio,
    gazeOutLeft,
    gazeOutRight,
    gazeDownLeft,
    gazeDownRight,
    irisOffLeft,
    irisOffRight,
    blinkLeft,
    blinkRight,
    config,
  } = signals;

  if (faceCount === 0) return { type: "face_hidden" };
  if (faceCount > 1) return { type: "multiple_faces" };

  const turnedLeft = yawRatio !== null && yawRatio < config.yawMin;
  const turnedRight = yawRatio !== null && yawRatio > config.yawMax;
  const gazingOut =
    gazeOutLeft > config.gazeOutThreshold || gazeOutRight > config.gazeOutThreshold;
  const irisOut =
    irisOffLeft > config.irisOutThreshold || irisOffRight > config.irisOutThreshold;
  const lookingDown =
    gazeDownLeft > config.gazeDownThreshold || gazeDownRight > config.gazeDownThreshold;

  if (turnedLeft || turnedRight || gazingOut || irisOut || lookingDown) {
    const detail = turnedLeft
      ? "head turned left (away from camera)"
      : turnedRight
        ? "head turned right (away from camera)"
        : lookingDown
          ? "eyes looking down (not at the camera)"
          : "eyes looking away from the screen";
    return { type: "look_away", detail };
  }

  if (blinkLeft > 0.5 && blinkRight > 0.5) {
    return { type: "eyes_closed" };
  }

  return null;
}

const INCIDENT_COUNTS = (incidents: ProctorIncident[]) => ({
  lookAwayCount: incidents.filter((i) => i.type === "look_away").length,
  faceHiddenCount: incidents.filter((i) => i.type === "face_hidden").length,
  multipleFacesCount: incidents.filter((i) => i.type === "multiple_faces").length,
  eyesClosedCount: incidents.filter((i) => i.type === "eyes_closed").length,
});

const TOTAL_LOOK_AWAY_MS = (incidents: ProctorIncident[]) =>
  incidents
    .filter((i) => i.type === "look_away")
    .reduce((sum, i) => sum + Math.max(0, i.endMs - i.startMs), 0);

/**
 * Decide the interview verdict from the incident log.
 * fail → repeated malpractice; review → one-off incidents; pass → clean.
 */
export function evaluateReport(incidents: ProctorIncident[]): "pass" | "review" | "fail" {
  const counts = INCIDENT_COUNTS(incidents);
  const totalLookAwayMs = TOTAL_LOOK_AWAY_MS(incidents);
  if (
    counts.lookAwayCount >= 3 ||
    counts.faceHiddenCount >= 2 ||
    counts.multipleFacesCount >= 2 ||
    totalLookAwayMs > 20_000
  ) {
    return "fail";
  }
  return incidents.length > 0 ? "review" : "pass";
}

export function buildReport(
  enabled: boolean,
  durationMs: number,
  incidents: ProctorIncident[],
  reason?: string
): ProctoringReport {
  const counts = INCIDENT_COUNTS(incidents);
  const result = enabled ? evaluateReport(incidents) : "off";
  return {
    enabled,
    reason,
    durationMs,
    incidents,
    ...counts,
    totalLookAwayMs: TOTAL_LOOK_AWAY_MS(incidents),
    result,
  };
}

// ------------------------------------------------------------- session ----

/**
 * Frame-driven state machine: turns a stream of per-frame classifications into
 * committed incidents (sustained long enough) plus live status updates.
 */
export class ProctorSession {
  private readonly config: Required<ProctorConfig>;
  private readonly startMs: number;
  private readonly incidents: ProctorIncident[] = [];
  private current: { type: ViolationType; sinceMs: number; detail?: string } | null = null;
  private lastCommitted: Partial<Record<ViolationType, number>> = {};

  constructor(startMs = 0, config: ProctorConfig = {}) {
    this.startMs = startMs;
    this.config = { ...DEFAULT_PROCTOR_CONFIG, ...config };
  }

  /**
   * Feed one frame classification. Returns status for the UI, and sets
   * `outIncident` when a new incident was just committed.
   */
  tick(
    nowMs: number,
    frame: { type: ViolationType | null; detail?: string } | null,
    outIncident?: { incident?: ProctorIncident }
  ): ProctorStatus {
    const elapsed = nowMs - this.startMs;
    if (outIncident) outIncident.incident = undefined;

    if (!frame || !frame.type) {
      this.current = null;
      return { state: "ok" };
    }

    const { sustainMs, cooldownMs } = this.config;
    const sustainFor = (type: ViolationType) =>
      type === "eyes_closed"
        ? this.config.eyesClosedSustainMs
        : type === "face_hidden"
          ? this.config.faceHiddenSustainMs
          : sustainMs;

    if (!this.current || this.current.type !== frame.type) {
      this.current = { type: frame.type, sinceMs: elapsed, detail: frame.detail };
    }

    const since = this.current.sinceMs;
    const duration = elapsed - since;
    const lastCommittedAt = this.lastCommitted[frame.type];

    if (duration >= sustainFor(frame.type)) {
      const cooldownOk = lastCommittedAt === undefined || elapsed - lastCommittedAt >= cooldownMs;
      if (cooldownOk) {
        const incident: ProctorIncident = {
          type: frame.type,
          startMs: since,
          endMs: elapsed,
          detail: frame.detail,
        };
        this.incidents.push(incident);
        this.lastCommitted[frame.type] = elapsed;
        this.current = null; // require the violation to clear before counting again
        if (outIncident) outIncident.incident = incident;
        return { state: "ok" };
      }
    }

    return { state: "violating", type: frame.type, sinceMs: since, detail: frame.detail };
  }

  getIncidents(): ProctorIncident[] {
    return this.incidents;
  }

  getReport(nowMs = this.startMs): ProctoringReport {
    return buildReport(true, Math.max(0, nowMs - this.startMs), this.incidents);
  }
}

// -------------------------------------------------------- mediapipe glue ----

export interface ProctorCallbacks {
  onStatus?: (status: ProctorStatus) => void;
  onIncident?: (incident: ProctorIncident, report: ProctoringReport) => void;
}

export interface ProctorHandle {
  start(): Promise<void>;
  stop(): ProctoringReport;
  active: boolean;
}

const WASM_BASE_PATH = "/wasm";
const MODEL_PATH = "/models/face_landmarker.task";

interface LandmarkLike {
  x: number;
  y: number;
  z?: number;
}

interface FrameResultLike {
  faceLandmarks: LandmarkLike[][];
  faceBlendshapes: { categories: BlendCategory[] }[];
}

type LandmarkerLike = {
  detectForVideo(frame: unknown, timestamp: number): FrameResultLike;
  close(): void;
};

/**
 * Create and run the proctoring engine against a <video> element.
 * The heavy MediaPipe module + model are loaded lazily. Call `stop()` (or the
 * cleanup callback) when the interview finishes to release camera resources.
 */
export async function createProctor(
  video: HTMLVideoElement,
  callbacks: ProctorCallbacks = {},
  config: ProctorConfig = {}
): Promise<ProctorHandle> {
  const resolved = { ...DEFAULT_PROCTOR_CONFIG, ...config };
  const sessionStart = performance.now();
  const session = new ProctorSession(0, resolved);
  let landmarker: LandmarkerLike | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = false;

  // MediaPipe's TFLite runtime logs informational lines (e.g. "INFO: Created
  // TensorFlow Lite XNNPACK delegate for CPU.") to stderr, which the Emscripten
  // glue forwards through console.error. These are benign — filter them out for
  // the proctor's lifetime so they don't surface as Console Errors in dev tools.
  const originalConsoleError = console.error;
  const filteredConsoleError = (...args: Parameters<typeof console.error>) => {
    const first = typeof args[0] === "string" ? args[0].trim() : "";
    if (/^INFO:/.test(first)) return;
    originalConsoleError.apply(console, args);
  };
  let logFilterInstalled = false;
  const installLogFilter = () => {
    if (!logFilterInstalled) {
      logFilterInstalled = true;
      console.error = filteredConsoleError;
    }
  };
  const disposeLogFilter = () => {
    if (logFilterInstalled) {
      logFilterInstalled = false;
      if (console.error === filteredConsoleError) console.error = originalConsoleError;
    }
  };

  try {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
    installLogFilter();
    landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH },
      runningMode: "VIDEO",
      numFaces: 4,
      outputFaceBlendshapes: true,
    });
  } catch (error) {
    disposeLogFilter();
    throw error;
  }

  let lastTs = 0;

  const processFrame = (ts: number) => {
    if (stopped || !landmarker || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      schedule();
      return;
    }
    // MediaPipe VIDEO mode requires strictly monotonically increasing
    // timestamps; clamp to guarantee it across any timer/clock jitter.
    const frameTs = ts > lastTs ? ts : lastTs + 1;
    lastTs = frameTs;

    let result: FrameResultLike;
    try {
      result = landmarker.detectForVideo(video, frameTs);
    } catch (error) {
      // A single bad frame must not kill the monitoring loop.
      console.error("Proctor frame error (frame skipped):", error);
      schedule();
      return;
    }

    const face = result.faceLandmarks[0];
    const blendshapes = result.faceBlendshapes[0]?.categories;
    const iris = estimateIrisOutwardOffsets(face);

    const signals: FrameSignals = {
      faceCount: result.faceLandmarks.length,
      yawRatio: estimateHeadYawRatio(face),
      gazeOutLeft: getBlendScore(blendshapes, "eyeLookOutLeft"),
      gazeOutRight: getBlendScore(blendshapes, "eyeLookOutRight"),
      gazeDownLeft: getBlendScore(blendshapes, "eyeLookDownLeft"),
      gazeDownRight: getBlendScore(blendshapes, "eyeLookDownRight"),
      irisOffLeft: iris.left ?? 0,
      irisOffRight: iris.right ?? 0,
      blinkLeft: getBlendScore(blendshapes, "eyeBlinkLeft"),
      blinkRight: getBlendScore(blendshapes, "eyeBlinkRight"),
      config: resolved,
    };

    const frame = classifyFrame(signals);
    const outIncident: { incident?: ProctorIncident } = {};
    const status = session.tick(ts - sessionStart, frame, outIncident);
    callbacks.onStatus?.(status);
    if (outIncident.incident) {
      callbacks.onIncident?.(outIncident.incident, session.getReport(ts - sessionStart));
    }
    schedule();
  };

  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(() => {
      if (running && !stopped) processFrame(performance.now());
    }, resolved.sampleMs);
  };

  const handle: ProctorHandle = {
    active: false,
    async start() {
      if (stopped || running) return;
      running = true;
      handle.active = true;
      schedule();
    },
    stop() {
      if (stopped) return session.getReport();
      stopped = true;
      running = false;
      if (timer) clearTimeout(timer);
      disposeLogFilter();
      try {
        landmarker?.close();
      } catch {}
      landmarker = null;
      handle.active = false;
      const report = session.getReport(performance.now() - sessionStart);
      callbacks.onStatus?.({ state: "off" });
      return report;
    },
  };

  return handle;
}
