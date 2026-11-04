import { and, asc, ilike, or, sql, type AnyColumn } from "drizzle-orm";
import { bySoonestDeadline } from "./entries";
import type { Db } from "./index";
import { programme, scholarship } from "./schema";

// Catalog search serves both browsing (an empty search lists everything) and the add forms'
// duplicate suggestions.

export function searchOperations(db: Db) {
  return {
    /**
     * The Programmes and Scholarships matching a search, each with its next Deadline as of today
     * (YYYY-MM-DD), soonest first, then by name. Every word of the search must appear, in any
     * case, in an entry's name or its university (Programmes) or provider (Scholarships). An
     * empty search lists the whole Catalog.
     */
    async searchCatalog(_memberId: string, query: string, today: string) {
      const words = query.trim().split(/\s+/).filter(Boolean);
      const [programmes, scholarships] = await Promise.all([
        db
          .select({
            id: programme.id,
            name: programme.name,
            university: programme.university,
            country: programme.country,
            fundingIncluded: programme.fundingIncluded,
          })
          .from(programme)
          .where(matching(words, [programme.name, programme.university]))
          .orderBy(sql`lower(${programme.name})`, asc(programme.id)),
        db
          .select({
            id: scholarship.id,
            name: scholarship.name,
            provider: scholarship.provider,
            coverage: scholarship.coverage,
          })
          .from(scholarship)
          .where(matching(words, [scholarship.name, scholarship.provider]))
          .orderBy(sql`lower(${scholarship.name})`, asc(scholarship.id)),
      ]);
      return {
        programmes: await bySoonestDeadline(db, "programme", programmes, today),
        scholarships: await bySoonestDeadline(db, "scholarship", scholarships, today),
      };
    },
  };
}

/** Every word appears somewhere in these columns, ignoring case; no words matches everything. */
function matching(words: string[], columns: AnyColumn[]) {
  return and(
    ...words.map((word) => {
      const pattern = `%${word.replace(/[\\%_]/g, "\\$&")}%`;
      return or(...columns.map((column) => ilike(column, pattern)));
    }),
  );
}
