"use client";

/**
 * InterviewerAvatar — the AI interviewer's face.
 *
 * A single still portrait would look like a frozen photo, so this animates it:
 *
 *  - MOUTH: `public/interviewer.jpg` (lips closed) and `interviewer-speaking.jpg`
 *    are the same frame with only the mouth + jaw replaced, so cross-fading
 *    between them animates the mouth without ghosting the rest of the face.
 *    The cross-fade level comes from the agent's real audio track.
 *
 *  - BLINKS: a copy of the portrait is clipped to each eye and slid upwards, so
 *    the skin below the eye closes over it. Because it is the same image, the
 *    colour always matches.
 *
 *  - IDLE LIFE: slow breathing scale and a barely-there sway, so the face is
 *    never perfectly still between turns.
 *
 * The waveform hook reports zeros whenever its AudioContext is suspended (e.g.
 * before the first user gesture), so while the agent is speaking we fall back to
 * a synthetic syllable rhythm — the face keeps talking even if the analyser is
 * dead. When the analyser works, its output wins.
 */

import { useEffect, useRef } from "react";
import { useAudioWaveform, type TrackReference } from "@livekit/components-react";

const CLOSED_SRC = "/interviewer.jpg";
const OPEN_SRC = "/interviewer-speaking.jpg";

/**
 * Eye boxes as fractions of the frame, measured from `public/interviewer.jpg`.
 * `lip` is how far the lid curtain slides, as a fraction of the eye height.
 */
const EYES = [
  { left: 0.374, top: 0.4178, width: 0.088, height: 0.0579, lip: 0.85 },
  { left: 0.514, top: 0.4178, width: 0.075, height: 0.0579, lip: 0.85 },
] as const;

const CLOSING_MS = 95;
const OPENING_MS = 140;
const BLINK_GAP_MIN_MS = 1900;
const BLINK_GAP_JITTER_MS = 3600;

/** Attack/release smoothing: snap open on a consonant, ease shut after it. */
const ATTACK = 0.45;
const RELEASE = 0.14;
/** Running peak, so a quiet mic and a loud one both produce a full mouth. */
const PEAK_DECAY = 0.996;
const PEAK_FLOOR = 0.04;

interface Props {
  /** The agent's published audio track; drives the mouth when available. */
  audioTrack?: TrackReference;
  /** Whether the agent is in the room at all. */
  connected: boolean;
  /** LiveKit's own VAD result — used only when the analyser gives no signal. */
  speaking: boolean;
}

export default function InterviewerAvatar({
  audioTrack,
  connected,
  speaking,
}: Props) {
  const { bars } = useAudioWaveform(audioTrack, {
    barCount: 24,
    updateInterval: 60,
  });

  const mouthRef = useRef<HTMLDivElement>(null);
  const lidRefs = useRef<Array<HTMLDivElement | null>>([]);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Latest waveform + speaking flag for the animation loop, without
  // re-rendering React 60 times a second. Refreshed in an effect so the rAF
  // loop always sees the newest values without subscribing to state.
  const inputRef = useRef({ bars, connected, speaking });
  useEffect(() => {
    inputRef.current = { bars, connected, speaking };
  });

  // The analyser is only trustworthy once we have actually seen signal on it.
  const analyserOkRef = useRef(false);
  const lastSignalRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    let level = 0;
    let peak = PEAK_FLOOR;
    let blinkState: "idle" | "closing" | "opening" = "idle";
    let blinkPhaseStart = 0;
    let nextBlinkAt = performance.now() + 1600;
    const start = performance.now();
    let last = start;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(now - last, 100);
      last = now;
      const t = (now - start) / 1000;

      const { bars: levels, connected: isUp, speaking: isTalking } =
        inputRef.current;

      // ── mouth ────────────────────────────────────────────────────────────
      let raw = 0;
      for (const value of levels) if (value > raw) raw = value;

      if (raw > 0.002) {
        analyserOkRef.current = true;
        lastSignalRef.current = now;
      }
      // Give the analyser a moment to catch up after a long silence before we
      // assume it is broken (suspended AudioContext reports a permanent zero).
      const analyserLive = analyserOkRef.current && now - lastSignalRef.current < 4000;

      peak = Math.max(raw, peak * PEAK_DECAY, PEAK_FLOOR);
      let target = Math.min(1, (raw / (peak * 0.75)) ** 0.7);

      if (!analyserLive && isTalking) {
        // No usable signal but the agent is audibly talking — speak anyway.
        target =
          0.55 * Math.abs(Math.sin(t * 7.3)) +
          0.3 * Math.abs(Math.sin(t * 3.1 + 0.9)) +
          0.15 * Math.abs(Math.sin(t * 11.7));
        target = Math.min(1, target);
      }

      if (!isUp) target = 0;

      const rate = target > level ? ATTACK : RELEASE;
      level += (target - level) * Math.min(1, (dt / 16) * rate);
      if (level < 0.004) level = 0;

      if (mouthRef.current) mouthRef.current.style.opacity = level.toFixed(3);

      // ── blink ────────────────────────────────────────────────────────────
      let openness = 0;
      if (blinkState === "idle") {
        if (now >= nextBlinkAt) {
          blinkState = "closing";
          blinkPhaseStart = now;
        }
      } else if (blinkState === "closing") {
        const p = (now - blinkPhaseStart) / CLOSING_MS;
        if (p >= 1) {
          blinkState = "opening";
          blinkPhaseStart = now;
          openness = 1;
        } else {
          openness = 1 - (1 - p) * (1 - p); // ease out — shuts fast
        }
      } else {
        const p = (now - blinkPhaseStart) / OPENING_MS;
        if (p >= 1) {
          blinkState = "idle";
          openness = 0;
          nextBlinkAt =
            now + BLINK_GAP_MIN_MS + Math.random() * BLINK_GAP_JITTER_MS;
          // Occasional double blink, like a real person.
          if (Math.random() < 0.16) nextBlinkAt = now + 240;
        } else {
          openness = 1 - p * p; // ease in — opens a touch slower
        }
      }

      for (let i = 0; i < EYES.length; i += 1) {
        const el = lidRefs.current[i];
        if (el) {
          // Slide the skin below the eye up over it. The clip window stays put,
          // so the eye is covered by matching skin from just underneath.
          el.style.transform = `translateY(${-(EYES[i].height * EYES[i].lip * 100 * openness).toFixed(3)}%)`;
        }
      }

      // ── idle life ────────────────────────────────────────────────────────
      if (avatarRef.current) {
        const breathe = 1.02 + Math.sin(t * 0.9) * 0.004;
        const swayX = Math.sin(t * 0.31) * 0.25;
        const swayY = Math.cos(t * 0.23) * 0.18 + Math.sin(t * 1.6) * 0.06;
        avatarRef.current.style.transform =
          `translate(${swayX.toFixed(3)}%, ${swayY.toFixed(3)}%) scale(${breathe.toFixed(4)})`;
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0b0b0d]">
      {/* Everything shares one transform so the cross-fade, the lids and the
          breath all stay in registration. */}
      <div ref={avatarRef} className="absolute inset-0 will-change-transform">
        {/* lips closed */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${CLOSED_SRC})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* lips apart — revealed in proportion to how loud the agent is talking */}
        <div
          ref={mouthRef}
          className="absolute inset-0 opacity-0"
          style={{
            backgroundImage: `url(${OPEN_SRC})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* eyelids */}
        {EYES.map((eye, index) => (
          <div
            key={`${eye.left}-${eye.top}`}
            ref={(el) => {
              lidRefs.current[index] = el;
            }}
            className="absolute overflow-hidden"
            style={{
              left: `${eye.left * 100}%`,
              top: `${eye.top * 100}%`,
              width: `${eye.width * 100}%`,
              height: `${eye.height * 100}%`,
              // Feather both ends so the sliding skin has no hard seam.
              maskImage:
                "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            }}
          >
            <div
              ref={(el) => {
                // The transform must land on the skin, not the clip window:
                // moving the window would drag the whole rectangle across the
                // face instead of closing the eye.
                lidRefs.current[index] = el;
              }}
              className="absolute"
              style={{
                // The window is a sub-rect of the frame, so offset the copy
                // back to the frame origin before sliding it.
                left: `${-(eye.left * 100) / eye.width}%`,
                top: `${-(eye.top * 100) / eye.height}%`,
                width: `${100 / eye.width}%`,
                height: `${100 / eye.height}%`,
                backgroundImage: `url(${CLOSED_SRC})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        ))}
      </div>

      {/* Soft cinematic grade + vignette, so the portrait sits in the dark UI
          instead of looking pasted onto it. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.42)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
    </div>
  );
}
