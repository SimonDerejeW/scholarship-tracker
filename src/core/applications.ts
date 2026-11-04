import { and, asc, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import { InvalidInputError, NotFoundError } from "./errors";
import { KINDS, owner, requireEntry, type CatalogEntry } from "./entries";
import { found, isId, optional } from "./fields";
import type { Db } from "./index";
import { application, programme, scholarship, STAGES } from "./schema";

export type Stage = (typeof STAGES)[number];

// A Member's Applications are theirs alone (ADR 0001): every operation here is
// scoped to the acting Member, and another Member's Application reads as absent.

export function applicationOperations(db: Db) {
  return {
    /**
     * Starts tracking a Programme or Scholarship, at Interested. Returns the Application's id.
     * A Member has at most one Application per entry.
     */
    async startApplication(memberId: string, entry: CatalogEntry): Promise<number> {
      await requireEntry(db, entry);
      const [row] = await db
        .insert(application)
        .values({ memberId, ...owner(entry) })
        .onConflictDoNothing()
        .returning({ id: application.id });
      if (!row) {
        throw new InvalidInputError(
          `You already have an Application to this ${KINDS[entry.kind].name}.`,
        );
      }
      return row.id;
    },

    /** One of this Member's Applications with what it is to, or null if they have none with this id. */
    async getApplication(memberId: string, id: number) {
      if (!isId(id)) {
        return null;
      }
      const [row] = await applications(db).where(mine(memberId, id));
      if (!row) {
        return null;
      }
      const { fundsApplicationId, ...details } = withEntry(row);
      const [funds, fundedBy] = await Promise.all([
        fundsApplicationId === null
          ? []
          : summaries(db, memberId, eq(application.id, fundsApplicationId)),
        summaries(db, memberId, eq(application.fundsApplicationId, id)),
      ]);
      return {
        ...details,
        /** For a Scholarship Application: the Programme Application it would fund, if linked. */
        funds: funds[0] ?? null,
        /** For a Programme Application: the Scholarship Applications that would fund it. */
        fundedBy,
      };
    },

    /** This Member's Application to a Programme or Scholarship, or null if they aren't tracking it. */
    async applicationTo(memberId: string, entry: CatalogEntry) {
      const [row] = await db
        .select({ id: application.id, stage: application.stage })
        .from(application)
        .where(
          and(
            eq(application.memberId, memberId),
            eq(application[KINDS[entry.kind].owner], entry.id),
          ),
        );
      return row ?? null;
    },

    /** Moves an Application to any Stage, whatever its current one. */
    async setStage(memberId: string, id: number, stage: string): Promise<void> {
      if (!isStage(stage)) {
        throw new InvalidInputError("Pick a Stage.");
      }
      await updateMine(db, memberId, id, { stage });
    },

    /** This Member's Programme Applications, by name: what a Scholarship Application can link to. */
    async programmeApplications(memberId: string) {
      return summaries(db, memberId, isNotNull(application.programmeId));
    },

    /**
     * Names the Programme Application a Scholarship Application would fund, replacing any
     * it named before.
     */
    async linkApplication(
      memberId: string,
      id: number,
      programmeApplicationId: number,
    ): Promise<void> {
      const [entry, fundsEntry] = await Promise.all([
        entryOf(db, memberId, id),
        entryOf(db, memberId, programmeApplicationId),
      ]);
      if (!entry || !fundsEntry) {
        throw new NotFoundError("That Application no longer exists.");
      }
      if (entry.kind !== "scholarship") {
        throw new InvalidInputError(
          "Only a Scholarship Application can be linked to a Programme Application.",
        );
      }
      if (fundsEntry.kind !== "programme") {
        throw new InvalidInputError("Pick one of your Programme Applications.");
      }
      await updateMine(db, memberId, id, { fundsApplicationId: programmeApplicationId });
    },

    /** Stops a Scholarship Application naming a Programme Application it would fund. */
    async unlinkApplication(memberId: string, id: number): Promise<void> {
      await updateMine(db, memberId, id, { fundsApplicationId: null });
    },

    /** Replaces an Application's personal notes; blank clears them. */
    async editApplicationNotes(memberId: string, id: number, notes: string): Promise<void> {
      await updateMine(db, memberId, id, { notes: optional(notes) });
    },

    /** Stops tracking: deletes the Application. Deleting one that's already gone does nothing. */
    async deleteApplication(memberId: string, id: number): Promise<void> {
      if (isId(id)) {
        await db.delete(application).where(mine(memberId, id));
      }
    },
  };
}

/** Applications joined to the Programme or Scholarship each is to. */
export function applications(db: Db) {
  return db
    .select({
      id: application.id,
      stage: application.stage,
      notes: application.notes,
      fundsApplicationId: application.fundsApplicationId,
      programme: { id: programme.id, name: programme.name, detail: programme.university },
      scholarship: { id: scholarship.id, name: scholarship.name, detail: scholarship.provider },
    })
    .from(application)
    .leftJoin(programme, eq(programme.id, application.programmeId))
    .leftJoin(scholarship, eq(scholarship.id, application.scholarshipId))
    .$dynamic();
}

/** Orders `applications` rows by the name of what each is to, ignoring case. */
export const byEntryName = sql`lower(coalesce(${programme.name}, ${scholarship.name}))`;

type Row = Awaited<ReturnType<ReturnType<typeof applications>["execute"]>>[number];

/** An Application with its entry: the Programme's university, or the Scholarship's provider, as detail. */
export function withEntry({ programme, scholarship, ...row }: Row) {
  const entry = programme
    ? { kind: "programme" as const, ...programme }
    : { kind: "scholarship" as const, ...scholarship! };
  return { ...row, entry };
}

/** This Member's Applications matching a condition, by entry name: what each is to, and its Stage. */
async function summaries(db: Db, memberId: string, condition: SQL) {
  const rows = await applications(db)
    .where(and(eq(application.memberId, memberId), condition))
    .orderBy(byEntryName, asc(application.id));
  return rows.map(withEntry).map(({ id, stage, entry }) => ({ id, stage, entry }));
}

/** What one of this Member's Applications is to, or null if they have none with this id. */
export async function entryOf(db: Db, memberId: string, id: number) {
  if (!isId(id)) {
    return null;
  }
  const [row] = await db
    .select({ programmeId: application.programmeId, scholarshipId: application.scholarshipId })
    .from(application)
    .where(mine(memberId, id));
  if (!row) {
    return null;
  }
  return (
    row.programmeId !== null
      ? { kind: "programme", id: row.programmeId }
      : { kind: "scholarship", id: row.scholarshipId! }
  ) satisfies CatalogEntry;
}

/** The Application with this id, if it is this Member's. */
function mine(memberId: string, id: number) {
  return and(eq(application.memberId, memberId), eq(application.id, id));
}

/** Changes one of this Member's Applications; another Member's reads as not found. */
async function updateMine(
  db: Db,
  memberId: string,
  id: number,
  fields: { stage?: Stage; notes?: string | null; fundsApplicationId?: number | null },
) {
  const rows = isId(id)
    ? await db
        .update(application)
        .set({ ...fields, updatedAt: new Date() })
        .where(mine(memberId, id))
        .returning({ id: application.id })
    : [];
  found(rows, "Application");
}

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}
