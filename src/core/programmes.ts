import { asc, eq, sql } from "drizzle-orm";
import { InvalidInputError, NotFoundError } from "./errors";
import type { Db } from "./index";
import { deadline, member, programme, requirement } from "./schema";

export type ProgrammeInput = {
  name: string;
  university: string;
  country?: string | null;
  link?: string | null;
  fundingIncluded: boolean;
  notes?: string | null;
};

export type DeadlineInput = {
  label: string;
  /** A calendar date, YYYY-MM-DD. */
  date: string;
};

export type RequirementInput = {
  label: string;
  note?: string | null;
};

export function programmeOperations(db: Db) {
  return {
    /** Adds a Programme to the Catalog, recording the Member who added it. Returns its id. */
    async addProgramme(memberId: string, input: ProgrammeInput): Promise<number> {
      const [row] = await db
        .insert(programme)
        .values({ ...programmeFields(input), addedBy: memberId })
        .returning({ id: programme.id });
      return row.id;
    },

    /** Replaces a Programme's fields. Any Member may edit any Programme. */
    async editProgramme(_memberId: string, id: number, input: ProgrammeInput): Promise<void> {
      const rows = await db
        .update(programme)
        .set({ ...programmeFields(input), updatedAt: new Date() })
        .where(eq(programme.id, id))
        .returning({ id: programme.id });
      found(rows, "Programme");
    },

    /** Every Programme in the Catalog, by name. */
    async listProgrammes(_memberId: string) {
      return db
        .select({
          id: programme.id,
          name: programme.name,
          university: programme.university,
          country: programme.country,
          fundingIncluded: programme.fundingIncluded,
        })
        .from(programme)
        .orderBy(sql`lower(${programme.name})`, asc(programme.id));
    },

    /** A Programme with its Deadlines and Requirements, or null if there is none with this id. */
    async getProgramme(_memberId: string, id: number) {
      if (!isId(id)) {
        return null;
      }
      const [row] = await db
        .select({
          id: programme.id,
          name: programme.name,
          university: programme.university,
          country: programme.country,
          link: programme.link,
          fundingIncluded: programme.fundingIncluded,
          notes: programme.notes,
          addedBy: { id: member.id, name: member.name },
        })
        .from(programme)
        .innerJoin(member, eq(member.id, programme.addedBy))
        .where(eq(programme.id, id));
      if (!row) {
        return null;
      }
      const deadlines = await db
        .select({ id: deadline.id, label: deadline.label, date: deadline.date })
        .from(deadline)
        .where(eq(deadline.programmeId, id))
        .orderBy(asc(deadline.date), asc(deadline.id));
      const requirements = await db
        .select({ id: requirement.id, label: requirement.label, note: requirement.note })
        .from(requirement)
        .where(eq(requirement.programmeId, id))
        .orderBy(asc(requirement.id));
      return { ...row, deadlines, requirements };
    },

    /** Adds a Deadline to a Programme. Returns its id. */
    async addDeadline(_memberId: string, programmeId: number, input: DeadlineInput): Promise<number> {
      const fields = deadlineFields(input);
      await requireProgramme(db, programmeId);
      const [row] = await db
        .insert(deadline)
        .values({ ...fields, programmeId })
        .returning({ id: deadline.id });
      return row.id;
    },

    /** Replaces a Deadline's label and date. */
    async editDeadline(_memberId: string, id: number, input: DeadlineInput): Promise<void> {
      const rows = await db
        .update(deadline)
        .set(deadlineFields(input))
        .where(eq(deadline.id, id))
        .returning({ id: deadline.id });
      found(rows, "Deadline");
    },

    /** Removes a Deadline; removing one that's already gone does nothing. */
    async removeDeadline(_memberId: string, id: number): Promise<void> {
      await db.delete(deadline).where(eq(deadline.id, id));
    },

    /** Adds a Requirement to a Programme. Returns its id. */
    async addRequirement(
      _memberId: string,
      programmeId: number,
      input: RequirementInput,
    ): Promise<number> {
      const fields = requirementFields(input);
      await requireProgramme(db, programmeId);
      const [row] = await db
        .insert(requirement)
        .values({ ...fields, programmeId })
        .returning({ id: requirement.id });
      return row.id;
    },

    /** Replaces a Requirement's label and note. */
    async editRequirement(_memberId: string, id: number, input: RequirementInput): Promise<void> {
      const rows = await db
        .update(requirement)
        .set(requirementFields(input))
        .where(eq(requirement.id, id))
        .returning({ id: requirement.id });
      found(rows, "Requirement");
    },

    /** Removes a Requirement; removing one that's already gone does nothing. */
    async removeRequirement(_memberId: string, id: number): Promise<void> {
      await db.delete(requirement).where(eq(requirement.id, id));
    },
  };
}

/** Throws NotFoundError unless there is a Programme with this id. */
export async function requireProgramme(db: Db, id: number) {
  const rows = isId(id)
    ? await db.select({ id: programme.id }).from(programme).where(eq(programme.id, id))
    : [];
  found(rows, "Programme");
}

function programmeFields(input: ProgrammeInput) {
  return {
    name: required(input.name, "A Programme needs a name."),
    university: required(input.university, "A Programme needs a university."),
    country: optional(input.country),
    link: webAddress(optional(input.link)),
    fundingIncluded: input.fundingIncluded,
    notes: optional(input.notes),
  };
}

function required(value: string, message: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new InvalidInputError(message);
  }
  return trimmed;
}

function optional(value: string | null | undefined) {
  return value?.trim() || null;
}

function webAddress(link: string | null) {
  if (link === null) {
    return null;
  }
  const protocol = URL.parse(link)?.protocol;
  if (protocol !== "http:" && protocol !== "https:") {
    throw new InvalidInputError("The link must be a web address starting with http:// or https://.");
  }
  return link;
}

function deadlineFields(input: DeadlineInput) {
  return {
    label: required(input.label, "A Deadline needs a label."),
    date: calendarDate(input.date),
  };
}

function calendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const date = match && new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  if (!date || date.getUTCMonth() !== +match[2] - 1 || date.getUTCDate() !== +match[3]) {
    throw new InvalidInputError("A Deadline needs a date.");
  }
  return match[0];
}

function requirementFields(input: RequirementInput) {
  return {
    label: required(input.label, "A Requirement needs a label."),
    note: optional(input.note),
  };
}

function found(rows: unknown[], what: string) {
  if (rows.length === 0) {
    throw new NotFoundError(`That ${what} no longer exists.`);
  }
}

/** Whether this could be a Catalog id at all (they are Postgres integers). */
function isId(id: number) {
  return Number.isInteger(id) && id > 0 && id <= 2 ** 31 - 1;
}
