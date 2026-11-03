import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { programmeOperations } from "./programmes";
import type * as schema from "./schema";

export { InvalidInputError, NotFoundError } from "./errors";

// The core module: every rule lives here, and it is the only code that talks to
// the database. Next.js routes and server actions are thin adapters over it.

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export type CoreConfig = {
  db: Db;
  /** The Admin's email, configured at deploy time (ADR 0004). */
  adminEmail: string;
};

export function createCore({ db, adminEmail }: CoreConfig) {
  const admin = normalizeEmail(adminEmail);

  return {
    ...programmeOperations(db),

    /** Whether this email may sign in and become a Member. */
    async canSignIn(email: string): Promise<boolean> {
      return normalizeEmail(email) === admin;
    },
  };
}

export type Core = ReturnType<typeof createCore>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
