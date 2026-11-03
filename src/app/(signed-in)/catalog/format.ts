// Deadlines are calendar dates (YYYY-MM-DD) with no time of day, so they are
// read and formatted as UTC midnight: no timezone can shift them a day.
function toDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A Deadline's calendar date in parts, for the board's date column: "15 Jan" over "Fri 2027". */
export function dateParts(date: string) {
  const parts = Object.fromEntries(
    dateFormat.formatToParts(toDate(date)).map(({ type, value }) => [type, value]),
  );
  return {
    dayMonth: `${parts.day} ${parts.month}`,
    weekday: parts.weekday,
    year: parts.year,
  };
}
