import type { ParsedResume } from "@/types/resume";

/**
 * Role-matching output derived from a resume parse: the roles the AI thinks
 * this candidate fits, plus the single "best fit" role.
 *
 * `Profile` has no dedicated column for bestFitRole / candidateSummary /
 * topProjects, so they are persisted together with `suggestedRoles` as a JSON
 * object. Older rows stored a plain JSON array — `parseRoleInsights` reads both.
 */
export interface RoleInsights {
  roles: string[];
  bestFitRole: string | null;
  candidateSummary: string | null;
  topProjects: string[];
}

type ParsedRoleData = Pick<
  ParsedResume,
  "suggestedRoles" | "bestFitRole" | "candidateSummary" | "topProjects"
>;

const EMPTY: RoleInsights = {
  roles: [],
  bestFitRole: null,
  candidateSummary: null,
  topProjects: [],
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "") : [];

/** Returns the JSON string to store in `Profile.suggestedRoles`, or null when there is nothing to store. */
export function serializeRoleInsights(parsed: ParsedRoleData): string | null {
  const insights: RoleInsights = {
    roles: asStringArray(parsed.suggestedRoles),
    bestFitRole: parsed.bestFitRole?.trim() || null,
    candidateSummary: parsed.candidateSummary?.trim() || null,
    topProjects: asStringArray(parsed.topProjects),
  };

  if (
    insights.roles.length === 0 &&
    !insights.bestFitRole &&
    !insights.candidateSummary &&
    insights.topProjects.length === 0
  ) {
    return null;
  }

  return JSON.stringify(insights);
}

/** Reads `Profile.suggestedRoles`, tolerating both the new object shape and the legacy array shape. */
export function parseRoleInsights(raw: string | null | undefined): RoleInsights {
  if (!raw) return { ...EMPTY };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...EMPTY };
  }

  if (Array.isArray(parsed)) {
    return { ...EMPTY, roles: asStringArray(parsed) };
  }

  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    return {
      roles: asStringArray(obj.roles),
      bestFitRole:
        typeof obj.bestFitRole === "string" && obj.bestFitRole.trim() ? obj.bestFitRole.trim() : null,
      candidateSummary:
        typeof obj.candidateSummary === "string" && obj.candidateSummary.trim()
          ? obj.candidateSummary.trim()
          : null,
      topProjects: asStringArray(obj.topProjects),
    };
  }

  return { ...EMPTY };
}
