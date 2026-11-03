import type { CatalogEntry } from "@/core";

/** Where a Programme's or Scholarship's page lives. */
export function entryHref({ kind, id }: CatalogEntry) {
  return `/catalog/${kind === "programme" ? "programmes" : "scholarships"}/${id}`;
}

/** What each kind of entry is called on screen. */
export const KIND_NAMES = { programme: "Programme", scholarship: "Scholarship" } as const;
