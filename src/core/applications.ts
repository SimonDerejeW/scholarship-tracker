import { and, eq, sql } from "drizzle-orm";
import { InvalidInputError } from "./errors";
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
      return row ? withEntry(row) : null;
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

/** The Application with this id, if it is this Member's. */
function mine(memberId: string, id: number) {
  return and(eq(application.memberId, memberId), eq(application.id, id));
}

/** Changes one of this Member's Applications; another Member's reads as not found. */
async function updateMine(
  db: Db,
  memberId: string,
  id: number,
  fields: { stage?: Stage; notes?: string | null },
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
