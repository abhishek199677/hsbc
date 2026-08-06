export function timezoneLabel(timezone?: string | null): string {
  if (!timezone) return "IST";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    if (name) return name;
  } catch {
    // fall through
  }
  return timezone;
}
