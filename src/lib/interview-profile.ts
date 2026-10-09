export interface InterviewResumeDetails {
  role: string | null;
  experience: string | null;
  ready: boolean;
}

interface ResumeProfile {
  currentRole?: string | null;
  totalExperience?: string | null;
}

function cleanResumeValue(value?: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned || null;
}

export function getInterviewResumeDetails(
  profile: ResumeProfile
): InterviewResumeDetails {
  const role = cleanResumeValue(profile.currentRole);
  const experience = cleanResumeValue(profile.totalExperience);

  return {
    role,
    experience,
    ready: Boolean(role && experience),
  };
}
