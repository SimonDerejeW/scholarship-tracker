import { asc, eq, isNotNull } from "drizzle-orm";
import { InvalidInputError } from "./errors";
import { found, isId, optional, required } from "./fields";
import type { Db } from "./index";
import { deadline, programme, requirement, scholarship } from "./schema";

// What Programmes and Scholarships share: their Deadlines and Requirements.

/** A Programme or Scholarship in the Catalog. */
export type CatalogEntry = { kind: keyof typeof KINDS; id: number };

/** Each kind of entry: its table, its name, and the column pointing a Deadline or Requirement at it. */
const KINDS = {
  programme: { table: programme, name: "Programme", owner: "programmeId" },
  scholarship: { table: scholarship, name: "Scholarship", owner: "scholarshipId" },
} as const;

export type DeadlineInput = {
  label: string;
  /** A calendar date, YYYY-MM-DD. */
  date: string;
};

export type RequirementInput = {
  label: string;
  note?: string | null;
};

export function entryListOperations(db: Db) {
  return {
    /** Adds a Deadline to a Programme or Scholarship. Returns its id. */
    async addDeadline(
      _memberId: string,
      entry: CatalogEntry,
      input: DeadlineInput,
    ): Promise<number> {
      const fields = deadlineFields(input);
      await requireEntry(db, entry);
      const [row] = await db
        .insert(deadline)
        .values({ ...fields, ...owner(entry) })
        .returning({ id: deadline.id });
      return row.id;
    },

    /** Replaces a Deadline's label and date. */
    async editDeadline(_memberId: string, id: number, input: DeadlineInput): Promise<void> {
      const rows = await db
        .update(deadline)
        .set(deadlineFields(input))
        .where(eq(deadline.id, id))
        .returning({ id: deadline.id });
      found(rows, "Deadline");
    },

    /** Removes a Deadline; removing one that's already gone does nothing. */
    async removeDeadline(_memberId: string, id: number): Promise<void> {
      await db.delete(deadline).where(eq(deadline.id, id));
    },

    /** Adds a Requirement to a Programme or Scholarship. Returns its id. */
    async addRequirement(
      _memberId: string,
      entry: CatalogEntry,
      input: RequirementInput,
    ): Promise<number> {
      const fields = requirementFields(input);
      await requireEntry(db, entry);
      const [row] = await db
        .insert(requirement)
        .values({ ...fields, ...owner(entry) })
        .returning({ id: requirement.id });
      return row.id;
    },

    /** Replaces a Requirement's label and note. */
    async editRequirement(_memberId: string, id: number, input: RequirementInput): Promise<void> {
      const rows = await db
        .update(requirement)
        .set(requirementFields(input))
        .where(eq(requirement.id, id))
        .returning({ id: requirement.id });
      found(rows, "Requirement");
    },

    /** Removes a Requirement; removing one that's already gone does nothing. */
    async removeRequirement(_memberId: string, id: number): Promise<void> {
      await db.delete(requirement).where(eq(requirement.id, id));
    },
  };
}

/** An entry's Deadlines, by date, and its Requirements, in the order they were added. */
export async function entryListsOf(db: Db, entry: CatalogEntry) {
  const deadlines = await db
    .select({ id: deadline.id, label: deadline.label, date: deadline.date })
    .from(deadline)
    .where(belongsTo(deadline, entry))
    .orderBy(asc(deadline.date), asc(deadline.id));
  const requirements = await db
    .select({ id: requirement.id, label: requirement.label, note: requirement.note })
    .from(requirement)
    .where(belongsTo(requirement, entry))
    .orderBy(asc(requirement.id));
  return { deadlines, requirements };
}

/**
 * Catalog rows of one kind with each entry's next Deadline (the earliest on or after today,
 * a YYYY-MM-DD date), soonest first; then entries with no Deadlines yet; then those whose
 * Deadlines have all passed. Rows keep their given order within each group.
 */
export async function bySoonestDeadline<Row extends { id: number }>(
  db: Db,
  kind: CatalogEntry["kind"],
  rows: Row[],
  today: string,
) {
  const owner = deadline[KINDS[kind].owner];
  const deadlines = await db
    .select({ owner, label: deadline.label, date: deadline.date })
    .from(deadline)
    .where(isNotNull(owner))
    .orderBy(asc(deadline.date), asc(deadline.id));
  const next = new Map<number, { label: string; date: string }>();
  const hasDeadlines = new Set<number>();
  for (const { owner, label, date } of deadlines) {
    hasDeadlines.add(owner!);
    if (date >= today && !next.has(owner!)) {
      next.set(owner!, { label, date });
    }
  }

  const listed = rows.map((row) => ({
    ...row,
    nextDeadline: next.get(row.id) ?? null,
    deadlinesPassed: hasDeadlines.has(row.id) && !next.has(row.id),
  }));
  const group = ({ nextDeadline, deadlinesPassed }: (typeof listed)[number]) =>
    nextDeadline ? 0 : deadlinesPassed ? 2 : 1;
  // Array sort is stable, so ties keep the rows' given order.
  const date = (row: (typeof listed)[number]) => row.nextDeadline?.date ?? "";
  return listed.sort((a, b) => group(a) - group(b) || date(a).localeCompare(date(b)));
}

/** Throws NotFoundError unless this Programme or Scholarship exists. */
export async function requireEntry(db: Db, entry: CatalogEntry) {
  const { table, name } = KINDS[entry.kind];
  const rows = isId(entry.id)
    ? await db.select({ id: table.id }).from(table).where(eq(table.id, entry.id))
    : [];
  found(rows, name);
}

/** Whether a Deadline or Requirement belongs to this entry. */
export function belongsTo(table: typeof deadline | typeof requirement, entry: CatalogEntry) {
  return eq(table[KINDS[entry.kind].owner], entry.id);
}

/** The column values that make a new Deadline or Requirement belong to this entry. */
function owner(entry: CatalogEntry) {
  return { [KINDS[entry.kind].owner]: entry.id };
}

function deadlineFields(input: DeadlineInput) {
  return {
    label: required(input.label, "A Deadline needs a label."),
    date: calendarDate(input.date),
  };
}

function calendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const date = match && new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  if (!date || date.getUTCMonth() !== +match[2] - 1 || date.getUTCDate() !== +match[3]) {
    throw new InvalidInputError("A Deadline needs a date.");
  }
  return match[0];
}

function requirementFields(input: RequirementInput) {
  return {
    label: required(input.label, "A Requirement needs a label."),
    note: optional(input.note),
  };
}
