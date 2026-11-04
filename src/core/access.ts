import { and, type AnyColumn, asc, eq, inArray, isNotNull, isNull, type SQL, sql } from "drizzle-orm";
import { InvalidInputError, NotAllowedError } from "./errors";
import { found } from "./fields";
import type { Db } from "./index";
import { allowlistEntry, application, member, session } from "./schema";

// Who may join the circle (ADR 0004): the Admin, named by email at deploy time, and whoever
// the Admin puts on the Allowlist. Only the Admin may change it or remove Members.

export function accessOperations(db: Db, adminEmail: string) {
  const admin = normalizeEmail(adminEmail);
  const isAdminEmail = (email: string) => normalizeEmail(email) === admin;

  async function isAdmin(memberId: string): Promise<boolean> {
    const rows = await db
      .select({ email: member.email })
      .from(member)
      .where(and(eq(member.id, memberId), isNull(member.removedAt)));
    return rows.length > 0 && isAdminEmail(rows[0].email);
  }

  async function requireAdmin(memberId: string) {
    if (!(await isAdmin(memberId))) {
      throw new NotAllowedError("Only the Admin can do this.");
    }
  }

  return {
    /** Whether this Member is the Admin, who manages the Allowlist and Members. */
    isAdmin,

    /** Whether this email may sign in and become a Member. */
    async canSignIn(email: string): Promise<boolean> {
      if (isAdminEmail(email)) {
        return true;
      }
      const rows = await db
        .select({ email: allowlistEntry.email })
        .from(allowlistEntry)
        .where(eq(allowlistEntry.email, normalizeEmail(email)));
      return rows.length > 0;
    },

    /** The emails on the Allowlist, alphabetically. The Admin can sign in whether or not theirs is. */
    async listAllowlist(adminId: string): Promise<string[]> {
      await requireAdmin(adminId);
      const rows = await db
        .select({ email: allowlistEntry.email })
        .from(allowlistEntry)
        .orderBy(asc(allowlistEntry.email));
      return rows.map((row) => row.email);
    },

    /**
     * Lets this email sign in. A removed Member with this email is a Member again, with none of
     * their old Applications. Adding an email already on the Allowlist changes nothing.
     */
    async addToAllowlist(adminId: string, email: string): Promise<void> {
      await requireAdmin(adminId);
      const normalized = normalizeEmail(email);
      if (!EMAIL.test(normalized)) {
        throw new InvalidInputError("Enter an email address, like name@example.com.");
      }
      await db.transaction(async (tx) => {
        await tx.insert(allowlistEntry).values({ email: normalized }).onConflictDoNothing();
        await tx
          .update(member)
          .set({ removedAt: null })
          .where(and(hasEmail(normalized), isNotNull(member.removedAt)));
      });
    },

    /**
     * Stops this email from signing in, and signs out a Member who has it, since sign-in is the
     * only time Better Auth checks the Allowlist. Their Applications stay until they are removed
     * as a Member. Removing an email that isn't on the Allowlist changes nothing.
     */
    async removeFromAllowlist(adminId: string, email: string): Promise<void> {
      await requireAdmin(adminId);
      const normalized = normalizeEmail(email);
      await db.transaction(async (tx) => {
        await tx.delete(allowlistEntry).where(eq(allowlistEntry.email, normalized));
        if (!isAdminEmail(normalized)) {
          await endSessions(tx, hasEmail(normalized));
        }
      });
    },

    /**
     * Everyone who has signed in and not been removed, alphabetically by name, with whether
     * they can still sign in (a Member taken off the Allowlist keeps their Applications).
     */
    async listMembers(adminId: string) {
      await requireAdmin(adminId);
      const rows = await db
        .select({
          id: member.id,
          name: member.name,
          email: member.email,
          onAllowlist: isNotNull(allowlistEntry.email).mapWith(Boolean),
        })
        .from(member)
        .leftJoin(allowlistEntry, hasEmail(allowlistEntry.email))
        .where(isNull(member.removedAt))
        .orderBy(asc(member.name), asc(member.email));
      return rows.map(({ onAllowlist, ...row }) => {
        const isAdmin = isAdminEmail(row.email);
        return { ...row, isAdmin, canSignIn: isAdmin || onAllowlist };
      });
    },

    /**
     * Removes a Member: deletes their Applications with their ticks and Personal items, takes
     * their email off the Allowlist and signs them out. The Catalog entries they added stay and
     * still name them. The Admin can't be removed.
     */
    async removeMember(adminId: string, memberId: string): Promise<void> {
      await requireAdmin(adminId);
      const rows = await db
        .select({ email: member.email })
        .from(member)
        .where(and(eq(member.id, memberId), isNull(member.removedAt)));
      found(rows, "Member");
      const email = normalizeEmail(rows[0].email);
      if (isAdminEmail(email)) {
        throw new NotAllowedError("The Admin can't be removed.");
      }
      await db.transaction(async (tx) => {
        await tx.update(member).set({ removedAt: new Date() }).where(eq(member.id, memberId));
        await tx.delete(allowlistEntry).where(eq(allowlistEntry.email, email));
        await endSessions(tx, eq(member.id, memberId));
        // Ticks and Personal items go with their Applications.
        await tx.delete(application).where(eq(application.memberId, memberId));
      });
    },
  };
}

/** Signs out every Member matching this condition. */
async function endSessions(db: Db, which: SQL) {
  await db
    .delete(session)
    .where(inArray(session.userId, db.select({ id: member.id }).from(member).where(which)));
}

/** Members with this email; the Allowlist is stored normalized, Better Auth's emails may not be. */
function hasEmail(normalized: string | AnyColumn) {
  return sql`lower(${member.email}) = ${normalized}`;
}

/** Loose on purpose: Google decides what a real address is; this only catches typos. */
const EMAIL = /^[^\s@]+@[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
