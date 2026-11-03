import { asc, eq, sql } from "drizzle-orm";
import { bySoonestDeadline, entryListsOf } from "./entries";
import { found, isId, optional, required, webAddress } from "./fields";
import type { Db } from "./index";
import { member, programme } from "./schema";

export type ProgrammeInput = {
  name: string;
  university: string;
  country?: string | null;
  link?: string | null;
  fundingIncluded: boolean;
  notes?: string | null;
};

export function programmeOperations(db: Db) {
  return {
    /** Adds a Programme to the Catalog, recording the Member who added it. Returns its id. */
    async addProgramme(memberId: string, input: ProgrammeInput): Promise<number> {
      const [row] = await db
        .insert(programme)
        .values({ ...programmeFields(input), addedBy: memberId })
        .returning({ id: programme.id });
      return row.id;
    },

    /** Replaces a Programme's fields. Any Member may edit any Programme. */
    async editProgramme(_memberId: string, id: number, input: ProgrammeInput): Promise<void> {
      const rows = await db
        .update(programme)
        .set({ ...programmeFields(input), updatedAt: new Date() })
        .where(eq(programme.id, id))
        .returning({ id: programme.id });
      found(rows, "Programme");
    },

    /**
     * Every Programme in the Catalog with its next Deadline as of today (YYYY-MM-DD), soonest
     * first, then by name.
     */
    async listProgrammes(_memberId: string, today: string) {
      const rows = await db
        .select({
          id: programme.id,
          name: programme.name,
          university: programme.university,
          country: programme.country,
          fundingIncluded: programme.fundingIncluded,
        })
        .from(programme)
        .orderBy(sql`lower(${programme.name})`, asc(programme.id));
      return bySoonestDeadline(db, "programme", rows, today);
    },

    /** A Programme with its Deadlines and Requirements, or null if there is none with this id. */
    async getProgramme(_memberId: string, id: number) {
      if (!isId(id)) {
        return null;
      }
      const [row] = await db
        .select({
          id: programme.id,
          name: programme.name,
          university: programme.university,
          country: programme.country,
          link: programme.link,
          fundingIncluded: programme.fundingIncluded,
          notes: programme.notes,
          addedBy: { id: member.id, name: member.name },
        })
        .from(programme)
        .innerJoin(member, eq(member.id, programme.addedBy))
        .where(eq(programme.id, id));
      if (!row) {
        return null;
      }
      return { ...row, ...(await entryListsOf(db, { kind: "programme", id })) };
    },
  };
}

function programmeFields(input: ProgrammeInput) {
  return {
    name: required(input.name, "A Programme needs a name."),
    university: required(input.university, "A Programme needs a university."),
    country: optional(input.country),
    link: webAddress(optional(input.link)),
    fundingIncluded: input.fundingIncluded,
    notes: optional(input.notes),
  };
}
