export interface PlanLimits {
  interviewsPerMonth: number;
  videoRetentionDays: number;
  supportsAnalytics: boolean;
}

export function getPlanLimits(plan: string): PlanLimits {
  switch (plan) {
    case "enterprise":
      return { interviewsPerMonth: Infinity, videoRetentionDays: 365, supportsAnalytics: true };
    case "pro":
      return { interviewsPerMonth: 100, videoRetentionDays: 180, supportsAnalytics: true };
    default:
      return { interviewsPerMonth: 3, videoRetentionDays: 30, supportsAnalytics: false };
  }
}

export function isPaidPlan(plan: string): boolean {
  return plan === "pro" || plan === "enterprise";
}

// A subscription is usable unless it is explicitly canceled/unpaid.
export function isPlanActive(plan: string, planStatus: string | null): boolean {
  if (!isPaidPlan(plan)) return true;
  if (!planStatus) return false;
  return planStatus === "active" || planStatus === "trialing" || planStatus === "past_due";
}
