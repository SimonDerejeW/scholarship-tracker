import Link from "next/link";
import { ChevronLeft, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * The Departures Board's shared pieces (DESIGN.md): page and section headings,
 * banded rows, the back link, tags and empty states. Screens compose these
 * rather than restyling their own.
 */

/** A page's title: condensed caps, unless it is an entry name, which keeps its typed case. */
export function PageTitle({
  children,
  entryName = false,
  className,
}: {
  children: React.ReactNode;
  entryName?: boolean;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-display text-title font-bold text-balance",
        entryName ? "tracking-[0.005em]" : "tracking-[0.02em] uppercase",
        className,
      )}
    >
      {children}
    </h1>
  );
}

/** One line under a page title. */
export function PageLede({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 max-w-prose text-muted-foreground">{children}</p>;
}

/** A section heading inside a page: condensed caps over a rule. */
export function SectionHeading({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-end justify-between gap-4 border-b border-rule pb-2">
      <h2 className="board-caps text-section font-bold">{children}</h2>
      {action}
    </div>
  );
}

/** The way back to the parent page. Keeps the parent's typed case: it is often an entry name. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex min-h-11 max-w-full items-center gap-1 pr-2 font-display text-base font-semibold tracking-[0.01em] text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{children}</span>
    </Link>
  );
}

/**
 * Board rows: full-bleed on a phone, banded on alternate rows. Give each
 * child `boardRow`, or `boardRowShell` around a `boardRowLink` when the whole row is a link.
 */
export function BoardRows({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ul className={cn("-mx-4 sm:mx-0", className)}>{children}</ul>;
}

/** A board row's line: rule below, banded when odd. Wrap a `boardRowLink` in it. */
export const boardRowShell = "border-b border-rule odd:bg-band";

/** A board row with its own padding, for rows that are not a single link. */
export const boardRow = `${boardRowShell} px-4 py-3`;

export const boardRowLink =
  "block px-4 py-3 transition-colors duration-150 hover:bg-band-hover focus-visible:-outline-offset-2";

/** A column header strip above board rows. */
export function BoardColumns({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-4 border-b border-rule px-4 py-2 font-display text-label font-semibold tracking-[0.1em] text-muted-foreground uppercase sm:mx-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A small bordered label on an entry, e.g. Funding included. */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-edge px-1.5 py-0.5 font-display text-label leading-none font-semibold tracking-[0.06em] text-foreground uppercase">
      {children}
    </span>
  );
}

/** What a board shows when it has no rows yet. */
export function EmptyBoard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="-mx-4 border-y border-rule bg-band px-4 py-8 text-center sm:mx-0">
      <p className="board-caps text-entry font-semibold">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-prose text-muted-foreground">{children}</p>}
    </div>
  );
}

/** A loading placeholder for a Suspense boundary. */
export function Loading() {
  return (
    <p role="status" className="mt-6 board-caps text-label font-semibold text-muted-foreground">
      Loading…
    </p>
  );
}

/**
 * An error: what went wrong and how to recover. Ink, an icon and an edge
 * border, never red: red is reserved for Missed.
 */
export function ErrorNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md border border-edge bg-band p-3 text-sm font-medium",
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/** A form-level error, or nothing. */
export function FormError({ error, className }: { error?: string; className?: string }) {
  return error ? <ErrorNote className={className}>{error}</ErrorNote> : null;
}

/** What a missing page says, inside or outside the signed-in shell. */
export function NotFoundMessage() {
  return (
    <>
      <PageTitle>Not found</PageTitle>
      <PageLede>
        There&apos;s nothing at this address. It may have been removed from the Catalog.
      </PageLede>
    </>
  );
}
