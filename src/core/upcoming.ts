import { and, asc, count, eq, inArray, or, sql } from "drizzle-orm";
import { applications, byEntryName, isStage, withEntry, type Stage } from "./applications";
import type { Db } from "./index";
import {
  application,
  deadline,
  personalItem,
  requirement,
  requirementTick,
  STAGES,
} from "./schema";

// Upcoming: the home screen's view of a Member's Applications, by next Deadline.
// `today` is a calendar date (YYYY-MM-DD) passed in, never read from the clock.

/** Which Applications Upcoming shows: those at open Stages, at every Stage, or at one. */
export type StageFilter = "open" | "all" | Stage;

/** Stages still in progress; the rest (Accepted, Rejected, Withdrawn) are finished. */
export const OPEN_STAGES: readonly Stage[] = ["Interested", "Preparing", "Submitted", "Interview"];

/** Open Stages where the Member is actively moving the Application along. */
export const MOVING_STAGES: readonly Stage[] = ["Preparing", "Submitted", "Interview"];

/** A Stage filter from untrusted input, e.g. the address: unknown values mean the open Stages. */
export function toStageFilter(value: string | undefined): StageFilter {
  return value === "all" || (value !== undefined && isStage(value)) ? value : "open";
}

/** The Stages at which an Application is Missed once every Deadline has passed. */
const MISSABLE: ReadonlySet<Stage> = new Set(["Interested", "Preparing"]);

/** An Interested Application is highlighted when its next Deadline is at most this many days off. */
const HIGHLIGHT_DAYS = 30;

export function upcomingOperations(db: Db) {
  return {
    /**
     * This Member's Applications at the filter's Stages, each with its next Deadline (the
     * earliest on or after `today`) and days left, Checklist progress, and whether it is Missed
     * or highlighted. Ordered by next Deadline, soonest first; then Missed; then those whose
     * Deadlines have all passed at a later Stage; then those with no Deadlines (Deadline TBA).
     */
    async upcoming(memberId: string, today: string, stageFilter: StageFilter) {
      const mine = eq(application.memberId, memberId);
      const [rows, deadlines, progress] = await Promise.all([
        applications(db)
          .where(and(mine, inArray(application.stage, stagesOf(stageFilter))))
          .orderBy(byEntryName, asc(application.id)),
        db
          .select({ applicationId: application.id, label: deadline.label, date: deadline.date })
          .from(deadline)
          .innerJoin(application, ofItsEntry(deadline))
          .where(mine)
          .orderBy(asc(deadline.date), asc(deadline.id)),
        checklistProgress(db, memberId),
      ]);

      const listed = rows.map(withEntry).map(({ notes: _notes, ...row }) => {
        const own = deadlines.filter((d) => d.applicationId === row.id);
        const next = own.find((d) => d.date >= today);
        const last = !next && own.length > 0 ? own[own.length - 1] : null;
        const daysLeft = next ? daysBetween(today, next.date) : null;
        return {
          ...row,
          nextDeadline: next ? { label: next.label, date: next.date, daysLeft: daysLeft! } : null,
          /** When every Deadline has passed: the latest of them. */
          lastDeadline: last && { label: last.label, date: last.date },
          missed: last !== null && MISSABLE.has(row.stage),
          highlight: row.stage === "Interested" && daysLeft !== null && daysLeft <= HIGHLIGHT_DAYS,
          progress: progress.get(row.id) ?? { done: 0, total: 0 },
        };
      });

      // Array sort is stable, so ties keep the entry-name order.
      const group = (row: (typeof listed)[number]) =>
        row.nextDeadline ? 0 : row.missed ? 1 : row.lastDeadline ? 2 : 3;
      const date = (row: (typeof listed)[number]) => row.nextDeadline?.date ?? "";
      return withLinkedTogether(
        listed.sort((a, b) => group(a) - group(b) || date(a).localeCompare(date(b))),
      );
    },
  };
}

/**
 * Moves each Scholarship Application linked to a shown Programme Application to just after it.
 * `fundsApplicationId` is left set only on those, so a link to a Programme Application that
 * isn't shown (say, filtered out by Stage) reads as unlinked.
 * The pair takes the place of whichever of them comes first, so an early Scholarship Deadline
 * still surfaces.
 */
function withLinkedTogether<Row extends { id: number; fundsApplicationId: number | null }>(
  rows: Row[],
) {
  const shown = new Map(rows.map((row) => [row.id, row]));
  const leadOf = (row: Row) =>
    row.fundsApplicationId !== null && shown.has(row.fundsApplicationId)
      ? row.fundsApplicationId
      : row.id;
  const placed = new Set<number>();
  return rows.flatMap((row) => {
    const lead = leadOf(row);
    if (placed.has(lead)) {
      return [];
    }
    placed.add(lead);
    const linked = rows.filter((other) => other.id !== lead && leadOf(other) === lead);
    return [shown.get(lead)!, ...linked].map((other) => ({
      ...other,
      fundsApplicationId: other.id === lead ? null : lead,
    }));
  });
}

/** Joins a Deadline or Requirement to the Applications made to its Programme or Scholarship. */
function ofItsEntry(table: typeof deadline | typeof requirement) {
  return or(
    eq(table.programmeId, application.programmeId),
    eq(table.scholarshipId, application.scholarshipId),
  );
}

/** How much of each of this Member's Checklists is ticked off, by Application id. */
async function checklistProgress(db: Db, memberId: string) {
  const mine = eq(application.memberId, memberId);
  const ticked = sql<number>`count(*) filter (where ${personalItem.ticked})`.mapWith(Number);
  const [requirements, personalItems] = await Promise.all([
    db
      .select({
        applicationId: application.id,
        done: count(requirementTick.requirementId),
        total: count(),
      })
      .from(requirement)
      .innerJoin(application, ofItsEntry(requirement))
      .leftJoin(
        requirementTick,
        and(
          eq(requirementTick.requirementId, requirement.id),
          eq(requirementTick.applicationId, application.id),
        ),
      )
      .where(mine)
      .groupBy(application.id),
    db
      .select({ applicationId: application.id, done: ticked, total: count() })
      .from(personalItem)
      .innerJoin(application, eq(application.id, personalItem.applicationId))
      .where(mine)
      .groupBy(application.id),
  ]);

  const progress = new Map<number, { done: number; total: number }>();
  for (const { applicationId, done, total } of [...requirements, ...personalItems]) {
    const sum = progress.get(applicationId) ?? { done: 0, total: 0 };
    progress.set(applicationId, { done: sum.done + done, total: sum.total + total });
  }
  return progress;
}

function stagesOf(filter: StageFilter): readonly Stage[] {
  return filter === "open" ? OPEN_STAGES : filter === "all" ? STAGES : [filter];
}

/** Whole days from one calendar date to a later one. */
function daysBetween(from: string, to: string) {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
}
