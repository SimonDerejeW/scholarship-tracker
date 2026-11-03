const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A Deadline's calendar date (YYYY-MM-DD) for display, e.g. "Fri, 15 Jan 2027". */
export function formatDate(date: string) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}
