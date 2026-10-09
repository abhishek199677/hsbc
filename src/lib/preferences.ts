/**
 * Preference values are extracted from the resume by the AI, which is free to
 * return free-text variants ("full time", "Bengaluru, India", "work from home").
 * The profile form renders them as <select>/<radio> options, so anything that
 * does not match an option exactly renders blank even though state was set.
 *
 * These normalisers are used in two places:
 *  - the upload route, before writing to `Profile`, so the DB holds clean values
 *  - the profile page, for values that came back from the AI payload directly
 */

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"] as const;
export const WORK_MODES = ["Remote", "Hybrid", "On-site"] as const;

export const PREFERRED_LOCATIONS = [
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Remote",
] as const;

export const LOCATION_ALIASES: Record<string, string> = {
  bengaluru: "Bangalore",
  bangaluru: "Bangalore",
  delhi: "Delhi NCR",
  "new delhi": "Delhi NCR",
  ncr: "Delhi NCR",
  gurgaon: "Delhi NCR",
  gurugram: "Delhi NCR",
  noida: "Delhi NCR",
};

export const NOTICE_PERIODS = ["Immediate", "15 days", "30 days", "60 days", "90 days"] as const;

/** "full time" / "FULL-TIME" -> "Full-time"; unknown -> "" */
export function normalizeJobType(raw?: string | null): string {
  if (!raw) return "";
  const value = raw.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (value.includes("full")) return "Full-time";
  if (value.includes("part")) return "Part-time";
  if (value.includes("contract")) return "Contract";
  if (value.includes("free") || value.includes("gig")) return "Freelance";
  return "";
}

/** "work from home" / "wfh" -> "Remote"; unknown -> "" */
export function normalizeWorkMode(raw?: string | null): string {
  if (!raw) return "";
  const value = raw.trim().toLowerCase();
  if (value.includes("remote") || value.includes("wfh") || value.includes("from home")) return "Remote";
  if (value.includes("hybrid")) return "Hybrid";
  if (value.includes("onsite") || value.includes("on-site") || value.includes("on site") || value.includes("office")) {
    return "On-site";
  }
  return "";
}

/**
 * Maps the AI's location wording onto one of the offered options.
 * Free text that cannot be matched is dropped rather than stored, otherwise the
 * <select> would render empty.
 */
export function normalizePreferredLocation(raw?: string | null): string {
  if (!raw) return "";
  const value = raw.trim().toLowerCase();
  if (!value) return "";
  if (value.includes("remote") || value.includes("wfh") || value.includes("anywhere")) return "Remote";
  const exact = PREFERRED_LOCATIONS.find((loc) => loc.toLowerCase() === value);
  if (exact) return exact;
  if (LOCATION_ALIASES[value]) return LOCATION_ALIASES[value];
  const aliasHit = Object.keys(LOCATION_ALIASES).find((alias) => value.includes(alias));
  if (aliasHit) return LOCATION_ALIASES[aliasHit];
  return PREFERRED_LOCATIONS.find((loc) => value.includes(loc.toLowerCase())) || "";
}

/** "2 months", "60 days notice", "immediately" -> one of `NOTICE_PERIODS`; unknown -> "" */
export function normalizeNoticePeriod(raw?: string | null): string {
  if (!raw) return "";
  const value = raw.trim().toLowerCase();
  if (!value) return "";
  if (/\b(immediate|immediately|asap|as soon as available|now|joining now)\b/.test(value)) return "Immediate";

  const months = value.match(/(\d+)\s*(?:months?|mos?)\b/);
  if (months) return daysToNotice(Number(months[1]) * 30);

  const weeks = value.match(/(\d+)\s*weeks?\b/);
  if (weeks) return daysToNotice(Number(weeks[1]) * 7);

  const days = value.match(/(\d+)\s*days?\b/);
  if (days) return daysToNotice(Number(days[1]));

  const bare = value.match(/\b(\d{1,3})\b/);
  if (bare && /\bday\b/.test(value)) return daysToNotice(Number(bare[1]));

  return "";
}

function daysToNotice(days: number): string {
  if (days <= 0) return "Immediate";
  const options = [15, 30, 60, 90];
  const closest = options.reduce((prev, curr) => (Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev));
  return `${closest} days`;
}
