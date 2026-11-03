import { dateParts } from "./format";

/** A Deadline's date as the board shows it: day and month in amber over weekday and year. */
export function DateBlock({ date }: { date: string }) {
  const parts = dateParts(date);
  return (
    <time dateTime={date} className="block w-24 shrink-0 font-display leading-tight">
      <span className="block text-entry font-semibold text-amber uppercase">{parts.dayMonth}</span>
      <span className="block text-label tracking-[0.06em] text-muted-foreground uppercase">
        {parts.weekday} {parts.year}
      </span>
    </time>
  );
}
