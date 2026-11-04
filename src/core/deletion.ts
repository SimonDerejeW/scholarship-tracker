import { eq } from "drizzle-orm";
import { KINDS, type CatalogEntry } from "./entries";
import { NotAllowedError } from "./errors";
import { found, isId } from "./fields";
import type { Db } from "./index";
import { application } from "./schema";

// Only the Member who added a Catalog entry may delete it, and only while no Application
// references it, so nobody's tracking disappears underneath them.

export function deletionOperations(db: Db) {
  return {
    /**
     * Deletes a Programme or Scholarship, with its Deadlines and Requirements. Refused unless
     * this Member added it and no Member has an Application to it; the refusal never says whose.
     */
    async deleteCatalogEntry(memberId: string, entry: CatalogEntry): Promise<void> {
      const { table, name, owner } = KINDS[entry.kind];
      const rows = isId(entry.id)
        ? await db.select({ addedBy: table.addedBy }).from(table).where(eq(table.id, entry.id))
        : [];
      found(rows, name);
      if (rows[0].addedBy !== memberId) {
        throw new NotAllowedError(`Only the Member who added this ${name} can delete it.`);
      }
      const inUse = new NotAllowedError(
        `This ${name} can't be deleted while anyone has an Application to it.`,
      );
      const applications = await db
        .select({ id: application.id })
        .from(application)
        .where(eq(application[owner], entry.id))
        .limit(1);
      if (applications.length > 0) {
        throw inUse;
      }
      try {
        await db.delete(table).where(eq(table.id, entry.id));
      } catch (error) {
        // An Application started since the check above holds the entry in place.
        if (isForeignKeyViolation(error)) {
          throw inUse;
        }
        throw error;
      }
    },
  };
}

/** Postgres refused because a row still references the one being deleted. */
function isForeignKeyViolation(error: unknown) {
  const cause = error instanceof Error ? error.cause : undefined;
  return (cause as { code?: string } | undefined)?.code === "23503";
}
