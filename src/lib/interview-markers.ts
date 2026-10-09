const MARKER =
  /(?:DIFFICULTY:\s*(?:easy|medium|hard)|PHASE:\s*(?:warmup|skill|coding|followup|wrapup))/i;
const INTERVIEW_MARKER_PATTERN = new RegExp(
  `\\s*\\[\\s*${MARKER.source}(?:\\s*\\|\\s*${MARKER.source})*\\s*\\]\\s*`,
  "gi"
);

export function stripInterviewMarkers(message: string | null | undefined): string {
  return (message ?? "").replace(INTERVIEW_MARKER_PATTERN, " ").trim();
}
