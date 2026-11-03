import { cn } from "@/lib/utils";

/**
 * Days left until a Deadline as split-flap tiles that flip in once on load (static under
 * reduced motion): two tiles, three from 100 days, and "– –" when the Deadline is TBA.
 * `row` staggers the flip down the board.
 */
export function DaysLeft({ days, row }: { days: number | null; row: number }) {
  const tiles = days === null ? ["–", "–"] : String(days).padStart(2, "0").split("");
  const label = days === 0 ? "Today" : days === 1 ? "Day" : "Days";

  return (
    <span className="flex flex-col items-end">
      <span className="flex gap-[3px]" aria-hidden>
        {tiles.map((tile, index) => (
          <span
            key={index}
            className={cn(
              "flap-in relative grid h-8 w-[22px] place-items-center rounded-sm bg-flap font-display text-2xl leading-none font-bold",
              "after:absolute after:inset-x-0 after:top-1/2 after:border-t after:border-flap-split",
              days === null ? "text-muted-foreground" : "text-amber",
            )}
            style={
              { "--flap-delay": `${Math.min(row, 12) * 60 + index * 90}ms` } as React.CSSProperties
            }
          >
            {tile}
          </span>
        ))}
      </span>
      <span className="mt-1 font-display text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {days !== null && days > 0 && <span className="sr-only">{days} </span>}
        {days === null ? "Days" : label}
      </span>
    </span>
  );
}
