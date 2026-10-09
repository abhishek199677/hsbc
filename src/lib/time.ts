/**
 * Interview times travel in two shapes: the booking UI shows 12-hour labels
 * ("01:30 PM") while `/api/interview` validates and stores 24-hour "HH:MM".
 * Rows written before that validation existed may still hold the 12-hour form.
 *
 * to24HourTime() canonicalises whatever arrives before a write/parse, and
 * formatTimeLabel() renders either shape as "h:mm AM/PM" for people.
 */

/** Any supported time string -> "HH:MM" (24-hour), or null when unparseable. */
export function to24HourTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) return raw;

  const match = raw.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!match) return null;

  let hours = Number(match[1]);
  if (hours < 1 || hours > 12) return null;
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/** Any supported time string -> "h:mm AM/PM" for display; unknown input is returned as-is. */
export function formatTimeLabel(value: string | null | undefined): string {
  if (!value) return "";
  const time24 = to24HourTime(value);
  if (!time24) return value.trim();

  const [hour24, minutes] = time24.split(":").map(Number);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}
