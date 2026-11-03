import { cn } from "@/lib/utils";
import { dateParts } from "./format";

/** A Deadline's date as the board shows it: day and month in amber over weekday and year. */
export function DateBlock({
  date,
  passed = false,
  className,
}: {
  date: string;
  /** A Deadline already gone by: mute, not amber. */
  passed?: boolean;
  className?: string;
}) {
  const parts = dateParts(date);
  return (
    <time dateTime={date} className={cn("block w-24 shrink-0 font-display leading-tight", className)}>
      <span
        className={cn(
          "block text-entry font-semibold uppercase",
          passed ? "text-muted-foreground" : "text-amber",
        )}
      >
        {parts.dayMonth}
      </span>
      <span className="block text-label tracking-[0.06em] text-muted-foreground uppercase">
        {parts.weekday} {parts.year}
      </span>
    </time>
  );
}
