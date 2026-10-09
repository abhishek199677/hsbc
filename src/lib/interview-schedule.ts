export function getInterviewDateLabels(
  year: number,
  monthIndex: number,
  day: number
): { long: string; short: string } {
  const date = new Date(year, monthIndex, day);
  return {
    long: date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    short: date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}
