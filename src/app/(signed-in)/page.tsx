import { CornerDownRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
  BoardColumns,
  BoardRows,
  boardRowLink,
  boardRowShell,
  EmptyBoard,
  Loading,
  PageTitle,
} from "@/components/board";
import {
  MOVING_STAGES,
  OPEN_STAGES,
  STAGES,
  toStageFilter,
  type StageFilter as Filter,
} from "@/core";
import { cn } from "@/lib/utils";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { today } from "@/server/today";
import { DateBlock } from "./catalog/date-block";
import { dateParts } from "./catalog/format";
import { DaysLeft } from "./days-left";
import { StageFilter } from "./stage-filter";

export default function UpcomingPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense
      fallback={
        <>
          <PageTitle>Upcoming</PageTitle>
          <Loading />
        </>
      }
    >
      <Upcoming searchParams={searchParams} />
    </Suspense>
  );
}

async function Upcoming({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const member = await requireMember();
  const { stage } = await searchParams;
  const filter = toStageFilter(Array.isArray(stage) ? stage[0] : stage);
  const date = await today();
  const applications = await core.upcoming(member.id, date, filter);
  const parts = dateParts(date);

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <PageTitle>Upcoming</PageTitle>
          <p className="mt-1 board-caps text-label font-semibold text-muted-foreground">
            <time dateTime={date}>
              {parts.weekday} {parts.dayMonth}
            </time>{" "}
            · Addis Ababa
          </p>
        </div>
        <StageFilter stages={STAGES} value={filter} />
      </div>
      {applications.length === 0 ? (
        <div className="mt-6">
          <Empty filter={filter} />
        </div>
      ) : (
        <Board applications={applications} />
      )}
    </>
  );
}

function Empty({ filter }: { filter: Filter }) {
  if (filter === "open" || filter === "all") {
    return (
      <EmptyBoard title="Nothing to track yet">
        Start an Application from any Programme or Scholarship in the Catalog and it will appear
        here.
      </EmptyBoard>
    );
  }
  return (
    <EmptyBoard title={`No Applications at ${filter}`}>
      Pick another Stage above to see the rest.
    </EmptyBoard>
  );
}

type Row = Awaited<ReturnType<typeof core.upcoming>>[number];

/**
 * A Scholarship Application linked to a Programme Application comes straight after it,
 * its name indented under the Programme's.
 *
 * The columns: on a phone, Date / Application (with Stage and Checklist on its second line) /
 * Days; from the wide breakpoint, Date / Application / Stage / Checklist / Days.
 */
const columns =
  "grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-x-3 wide:grid-cols-[6rem_minmax(0,1fr)_7.5rem_5.5rem_5.5rem] wide:gap-x-6";

function Board({ applications }: { applications: Row[] }) {
  return (
    <>
      <BoardColumns className={cn(columns, "mt-6 hidden wide:grid")}>
        <span>Date</span>
        <span>Application</span>
        <span>Stage</span>
        <span>Checklist</span>
        <span className="text-right">Days</span>
      </BoardColumns>
      <BoardRows className="mt-6 border-t border-rule wide:mt-0 wide:border-t-0">
        {applications.map((application, index) => (
          <li key={application.id} className={boardRowShell}>
            <Link
              href={`/applications/${application.id}`}
              className={cn(
                boardRowLink,
                columns,
                application.highlight && "border-l-[3px] border-l-amber pl-[13px]",
              )}
            >
              <DateCell application={application} />
              <span
                className={cn(
                  "block min-w-0",
                  application.fundsApplicationId !== null && "relative pl-6",
                )}
              >
                {application.fundsApplicationId !== null && (
                  <CornerDownRight
                    aria-hidden
                    className="absolute top-1 left-0 size-4 text-muted-foreground"
                  />
                )}
                <span
                  className={cn(
                    "block font-display text-entry font-semibold",
                    application.missed && "text-muted-foreground",
                  )}
                >
                  {application.entry.name}
                  {application.fundsApplicationId !== null && (
                    <span className="sr-only">, for the Programme Application above</span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  <span className="wide:hidden">
                    <StageWord application={application} /> ·{" "}
                    {application.progress.total > 0 && (
                      <>
                        <Progress {...application.progress} /> ·{" "}
                      </>
                    )}
                  </span>
                  <span className="hidden wide:inline">{application.entry.detail} · </span>
                  {deadlineLabel(application)}
                </span>
              </span>
              <span className="hidden wide:block">
                <StageWord application={application} />
              </span>
              <span className="hidden font-display text-entry font-semibold wide:block">
                {application.progress.total > 0 ? (
                  <Progress {...application.progress} />
                ) : (
                  <span className="text-muted-foreground">–</span>
                )}
              </span>
              <DaysCell application={application} row={index} />
            </Link>
          </li>
        ))}
      </BoardRows>
    </>
  );
}

/** The next Deadline's date; once all have passed, the last one's, in mute; or TBA. */
function DateCell({ application }: { application: Row }) {
  const { nextDeadline, lastDeadline } = application;
  if (nextDeadline) {
    return <DateBlock date={nextDeadline.date} className="w-auto" />;
  }
  if (lastDeadline) {
    return <DateBlock date={lastDeadline.date} passed className="w-auto" />;
  }
  return (
    <span className="font-display text-entry leading-tight font-semibold text-muted-foreground uppercase">
      TBA
    </span>
  );
}

function DaysCell({ application, row }: { application: Row; row: number }) {
  const { nextDeadline, lastDeadline, missed } = application;
  if (missed) {
    return (
      <span className="text-right font-display text-base leading-tight font-bold tracking-[0.06em] text-missed uppercase">
        Missed
      </span>
    );
  }
  if (lastDeadline) {
    return (
      <span className="text-right font-display text-label font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        Passed
      </span>
    );
  }
  return <DaysLeft days={nextDeadline?.daysLeft ?? null} row={row} />;
}

/**
 * The Stage in condensed caps: red when Missed, amber when highlighted, green while moving,
 * ink at Interested, mute once finished.
 */
function StageWord({ application: { stage, missed, highlight } }: { application: Row }) {
  return (
    <span
      className={cn(
        "font-display text-label font-semibold tracking-[0.06em] uppercase wide:text-base",
        missed
          ? "text-missed"
          : highlight
            ? "text-amber"
            : MOVING_STAGES.includes(stage)
              ? "text-moving"
              : OPEN_STAGES.includes(stage)
                ? "text-foreground"
                : "text-muted-foreground",
      )}
    >
      {stage}
    </span>
  );
}

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <span className="text-foreground">
      {done}/{total}
      <span className="sr-only"> on the Checklist</span>
    </span>
  );
}

/** Which Deadline the row is about: the next, the last that passed, or none yet. */
function deadlineLabel({ nextDeadline, lastDeadline }: Row) {
  return (nextDeadline ?? lastDeadline)?.label ?? "Deadline TBA";
}
