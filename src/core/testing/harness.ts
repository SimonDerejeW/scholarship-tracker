import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { test as base } from "vitest";
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
