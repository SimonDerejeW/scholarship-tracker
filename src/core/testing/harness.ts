import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { test as base } from "vitest";
import type { CatalogEntry, Db } from "@/core";
import * as schema from "@/core/schema";

// One migrated in-memory Postgres per test file; each test gets a fresh clone of it.
let template: Promise<PGlite> | undefined;

async function migratedTemplate() {
  const pg = new PGlite();
  await migrate(drizzle(pg), { migrationsFolder: "drizzle" });
  return pg;
}

export const test = base.extend("db", async ({}, { onCleanup }) => {
  template ??= migratedTemplate();
  const pg = (await (await template).clone()) as PGlite;
  onCleanup(() => pg.close());
  return drizzle(pg, { schema });
});

let memberCount = 0;

/** A signed-up Member. Better Auth creates these in the app, so tests insert them directly. */
export async function addMember(db: Db, { name }: { name: string }) {
  const id = `member-${++memberCount}`;
  const email = `${id}@example.com`;
  await db.insert(schema.member).values({ id, name, email });
  return { id, name, email };
}

/** The Catalog entry argument for a Programme's or Scholarship's Deadlines and Requirements. */
export function programmeEntry(id: number): CatalogEntry {
  return { kind: "programme", id };
}

export function scholarshipEntry(id: number): CatalogEntry {
  return { kind: "scholarship", id };
}
