import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { entryOf } from "./applications";
import { belongsTo } from "./entries";
import { NotFoundError } from "./errors";
import { found, isId, required } from "./fields";
import type { Db } from "./index";
import { application, personalItem, requirement, requirementTick } from "./schema";

// An Application's Checklist: its entry's current Requirements (ADR 0003), then
// the Member's Personal items. Like the Application, it is the Member's alone.

export function checklistOperations(db: Db) {
  return {
    /**
     * One of this Member's Applications' Checklist, with how much of it is ticked off,
     * or null if they have no Application with this id.
     */
    async getChecklist(memberId: string, applicationId: number) {
      const entry = await entryOf(db, memberId, applicationId);
      if (!entry) {
        return null;
      }
      const requirements = await db
        .select({
          id: requirement.id,
          label: requirement.label,
          note: requirement.note,
          ticked: isNotNull(requirementTick.requirementId).mapWith(Boolean),
        })
        .from(requirement)
        .leftJoin(
          requirementTick,
          and(
            eq(requirementTick.requirementId, requirement.id),
            eq(requirementTick.applicationId, applicationId),
          ),
        )
        .where(belongsTo(requirement, entry))
        .orderBy(asc(requirement.id));
      const personalItems = await db
        .select({ id: personalItem.id, label: personalItem.label, ticked: personalItem.ticked })
        .from(personalItem)
        .where(eq(personalItem.applicationId, applicationId))
        .orderBy(asc(personalItem.id));
      const items = [...requirements, ...personalItems];
      return {
        requirements,
        personalItems,
        progress: { done: items.filter((item) => item.ticked).length, total: items.length },
      };
    },

    /** Ticks a Requirement off an Application's Checklist, or unticks it. */
    async tickRequirement(
      memberId: string,
      applicationId: number,
      requirementId: number,
      ticked: boolean,
    ): Promise<void> {
      const entry = await requireEntryOf(db, memberId, applicationId);
      const onChecklist = isId(requirementId)
        ? await db
            .select({ id: requirement.id })
            .from(requirement)
            .where(and(eq(requirement.id, requirementId), belongsTo(requirement, entry)))
        : [];
      found(onChecklist, "Requirement");
      if (ticked) {
        await db
          .insert(requirementTick)
          .values({ applicationId, requirementId })
          .onConflictDoNothing();
      } else {
        await db
          .delete(requirementTick)
          .where(
            and(
              eq(requirementTick.applicationId, applicationId),
              eq(requirementTick.requirementId, requirementId),
            ),
          );
      }
    },

    /** Adds a Personal item to one of this Member's Applications, unticked. Returns its id. */
    async addPersonalItem(memberId: string, applicationId: number, label: string): Promise<number> {
      const fields = { applicationId, label: personalLabel(label) };
      await requireEntryOf(db, memberId, applicationId);
      const [row] = await db.insert(personalItem).values(fields).returning({ id: personalItem.id });
      return row.id;
    },

    /** Replaces a Personal item's label. */
    async editPersonalItem(memberId: string, id: number, label: string): Promise<void> {
      await updateMyPersonalItem(db, memberId, id, { label: personalLabel(label) });
    },

    /** Ticks a Personal item off, or unticks it. */
    async tickPersonalItem(memberId: string, id: number, ticked: boolean): Promise<void> {
      await updateMyPersonalItem(db, memberId, id, { ticked });
    },

    /** Deletes a Personal item; deleting one that's already gone does nothing. */
    async deletePersonalItem(memberId: string, id: number): Promise<void> {
      if (isId(id)) {
        await db.delete(personalItem).where(myPersonalItem(db, memberId, id));
      }
    },
  };
}

/** The Personal item with this id, if it is on one of this Member's Applications. */
function myPersonalItem(db: Db, memberId: string, id: number) {
  const theirs = db
    .select({ id: application.id })
    .from(application)
    .where(eq(application.memberId, memberId));
  return and(eq(personalItem.id, id), inArray(personalItem.applicationId, theirs));
}

/** Changes one of this Member's Personal items; another Member's reads as not found. */
async function updateMyPersonalItem(
  db: Db,
  memberId: string,
  id: number,
  fields: { label?: string; ticked?: boolean },
) {
  const rows = isId(id)
    ? await db
        .update(personalItem)
        .set(fields)
        .where(myPersonalItem(db, memberId, id))
        .returning({ id: personalItem.id })
    : [];
  found(rows, "Personal item");
}

function personalLabel(label: string) {
  return required(label, "A Personal item needs a label.");
}

/** Like `entryOf`, but another Member's Application, or a deleted one, throws NotFoundError. */
async function requireEntryOf(db: Db, memberId: string, applicationId: number) {
  const entry = await entryOf(db, memberId, applicationId);
  if (!entry) {
    throw new NotFoundError("That Application no longer exists.");
  }
  return entry;
}
