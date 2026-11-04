import { eq } from "drizzle-orm";
import { entryListsOf } from "./entries";
import { found, isId, optional, required, webAddress } from "./fields";
import type { Db } from "./index";
import { member, scholarship } from "./schema";

export type ScholarshipInput = {
  name: string;
  provider: string;
  link?: string | null;
  /** What it covers, e.g. tuition and a monthly stipend. */
  coverage?: string | null;
  notes?: string | null;
};

export function scholarshipOperations(db: Db) {
  return {
    /** Adds a Scholarship to the Catalog, recording the Member who added it. Returns its id. */
    async addScholarship(memberId: string, input: ScholarshipInput): Promise<number> {
      const [row] = await db
        .insert(scholarship)
        .values({ ...scholarshipFields(input), addedBy: memberId })
        .returning({ id: scholarship.id });
      return row.id;
    },

    /** Replaces a Scholarship's fields. Any Member may edit any Scholarship. */
    async editScholarship(_memberId: string, id: number, input: ScholarshipInput): Promise<void> {
      const rows = await db
        .update(scholarship)
        .set({ ...scholarshipFields(input), updatedAt: new Date() })
        .where(eq(scholarship.id, id))
        .returning({ id: scholarship.id });
      found(rows, "Scholarship");
    },

    /** A Scholarship with its Deadlines and Requirements, or null if there is none with this id. */
    async getScholarship(_memberId: string, id: number) {
      if (!isId(id)) {
        return null;
      }
      const [row] = await db
        .select({
          id: scholarship.id,
          name: scholarship.name,
          provider: scholarship.provider,
          link: scholarship.link,
          coverage: scholarship.coverage,
          notes: scholarship.notes,
          addedBy: { id: member.id, name: member.name },
        })
        .from(scholarship)
        .innerJoin(member, eq(member.id, scholarship.addedBy))
        .where(eq(scholarship.id, id));
      if (!row) {
        return null;
      }
      return { ...row, ...(await entryListsOf(db, { kind: "scholarship", id })) };
    },
  };
}

function scholarshipFields(input: ScholarshipInput) {
  return {
    name: required(input.name, "A Scholarship needs a name."),
    provider: required(input.provider, "A Scholarship needs a provider."),
    link: webAddress(optional(input.link)),
    coverage: optional(input.coverage),
    notes: optional(input.notes),
  };
}
