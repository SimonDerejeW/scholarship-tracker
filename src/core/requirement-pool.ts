import { asc } from "drizzle-orm";
import { belongsTo, requireEntry, type CatalogEntry } from "./entries";
import type { Db } from "./index";
import { requirement } from "./schema";

// The Requirement pool: common Requirements offered when adding one to a
// Programme or Scholarship. Picking one copies it; it stays unlinked from where
// it came from.

export type SuggestedRequirement = { label: string; note: string | null };

const STARTER_LABELS = [
  "CV",
  "Motivation letter",
  "Reference letters",
  "Transcript of records",
  "Degree certificate",
  "English language test",
  "Passport copy",
  "Application fee",
];

type PoolEntry = { count: number; spellings: Map<string, number>; notes: Map<string, number> };

export function requirementPoolOperations(db: Db) {
  return {
    /**
     * Requirements worth adding to this Programme or Scholarship: those already in the Catalog,
     * most used first, then the rest of a starter list of common ones. Each
     * carries the note most often given with it.
     */
    async suggestRequirements(
      _memberId: string,
      entry: CatalogEntry,
    ): Promise<SuggestedRequirement[]> {
      await requireEntry(db, entry);
      const inCatalog = await db
        .select({
          label: requirement.label,
          note: requirement.note,
          isOwn: belongsTo(requirement, entry).mapWith(Boolean),
        })
        .from(requirement)
        .orderBy(asc(requirement.id));

      // Labels that differ only in case or spacing are the same Requirement,
      // spelt the way most entries spell it.
      const pool = new Map<string, PoolEntry>();
      const alreadyHas = new Set<string>();
      for (const { label, note, isOwn } of inCatalog) {
        const key = poolKey(label);
        if (isOwn) {
          alreadyHas.add(key);
        }
        const pooled = pool.get(key) ?? { count: 0, spellings: new Map(), notes: new Map() };
        pooled.count += 1;
        tally(pooled.spellings, label);
        if (note) {
          tally(pooled.notes, note);
        }
        pool.set(key, pooled);
      }

      const used = [...pool.entries()]
        .filter(([key]) => !alreadyHas.has(key))
        .map(([, { count, spellings, notes }]) => ({
          count,
          label: mostUsed(spellings)!,
          note: mostUsed(notes),
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
        .map(({ label, note }) => ({ label, note }));
      const starters = STARTER_LABELS.filter((label) => !pool.has(poolKey(label))).map(
        (label) => ({ label, note: null }),
      );

      return [...used, ...starters];
    },
  };
}

function poolKey(label: string) {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}

function tally(counts: Map<string, number>, value: string) {
  counts.set(value, (counts.get(value) ?? 0) + 1);
}

/** The most frequent value; on a tie, the one seen first. */
function mostUsed(counts: Map<string, number>) {
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}
