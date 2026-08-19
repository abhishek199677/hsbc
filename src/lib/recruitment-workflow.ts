export const RECRUITMENT_STAGES = [
  "screening",
  "shortlisted",
  "interview-scheduled",
  "offered",
  "placed",
  "rejected",
] as const;

export type RecruitmentStage = (typeof RECRUITMENT_STAGES)[number];

const transitions: Record<string, RecruitmentStage[]> = {
  // "submitted" is retained for submissions created before the pipeline was introduced.
  submitted: ["shortlisted", "rejected"],
  screening: ["shortlisted", "rejected"],
  shortlisted: ["interview-scheduled", "rejected"],
  "interview-scheduled": ["offered", "rejected"],
  offered: ["placed", "rejected"],
  placed: [],
  rejected: [],
};

export function canTransitionSubmission(current: string, next: string): next is RecruitmentStage {
  return RECRUITMENT_STAGES.includes(next as RecruitmentStage) && transitions[current]?.includes(next as RecruitmentStage) === true;
}

export function nextSubmissionStage(current: string): RecruitmentStage | null {
  return transitions[current]?.find((stage) => stage !== "rejected") || null;
}

export function submissionStageLabel(stage: string): string {
  if (stage === "submitted") return "Screening";
  return stage
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
