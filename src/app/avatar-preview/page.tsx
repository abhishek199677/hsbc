"use client";

/**
 * TEMPORARY — visual check for InterviewerAvatar. Renders the real component
 * with no LiveKit room behind it (audioTrack undefined, speaking true), which
 * also proves the waveform hook degrades gracefully. Deleted after review.
 */

import InterviewerAvatar from "@/components/InterviewerAvatar";

export default function AvatarPreview() {
  return (
    <div className="min-h-screen bg-[#09090b] p-6 flex flex-col items-center gap-6">
      <div className="relative w-full max-w-[1100px] aspect-video rounded-xl overflow-hidden border border-[#27272a]">
        <InterviewerAvatar connected speaking />
      </div>
      <p className="text-[#71717a] text-xs">
        InterviewerAvatar — no room, no audio track: mouth driven by the
        speaking fallback, blinks and breathing live.
      </p>
    </div>
  );
}
