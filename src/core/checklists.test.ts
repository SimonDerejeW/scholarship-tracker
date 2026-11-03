import { describe, expect } from "vitest";
import { createCore, InvalidInputError, NotFoundError, type Db } from "@/core";
import { addMember, programmeEntry, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

const robotics = { name: "MSc Robotics", university: "TU Delft", fundingIncluded: false };

/** Ana's Application to a Programme with a CV and two reference letters required. */
async function applicationWithRequirements(db: Db) {
  const core = setup(db);
  const ana = await addMember(db, { name: "Ana" });
  const programmeId = await core.addProgramme(ana.id, robotics);
  const entry = programmeEntry(programmeId);
  const cv = await core.addRequirement(ana.id, entry, { label: "CV" });
  const references = await core.addRequirement(ana.id, entry, {
    label: "Reference letters",
    note: "Two, from academics",
  });
  const id = await core.startApplication(ana.id, entry);
  return { core, ana, entry, id, cv, references };
}

describe("an Application's Checklist", () => {
  test("starts as its entry's Requirements, in the order added, none ticked", async ({ db }) => {
    const { core, ana, id, cv, references } = await applicationWithRequirements(db);

    expect(await core.getChecklist(ana.id, id)).toEqual({
      requirements: [
        { id: cv, label: "CV", note: null, ticked: false },
        { id: references, label: "Reference letters", note: "Two, from academics", ticked: false },
      ],
      personalItems: [],
      progress: { done: 0, total: 2 },
    });
  });
});

describe("ticking a Requirement", () => {
  test("ticks it off, counts it done, and unticking undoes it", async ({ db }) => {
    const { core, ana, id, cv, references } = await applicationWithRequirements(db);

    await core.tickRequirement(ana.id, id, references, true);
    await core.tickRequirement(ana.id, id, references, true);
    expect(await core.getChecklist(ana.id, id)).toMatchObject({
      requirements: [
        { id: cv, ticked: false },
        { id: references, ticked: true },
      ],
      progress: { done: 1, total: 2 },
    });

    await core.tickRequirement(ana.id, id, references, false);
    await core.tickRequirement(ana.id, id, references, false);
    expect(await core.getChecklist(ana.id, id)).toMatchObject({
      requirements: [
        { id: cv, ticked: false },
        { id: references, ticked: false },
      ],
      progress: { done: 0, total: 2 },
    });
  });
});

describe("a Checklist follows the Catalog live", () => {
  test("a Requirement added later appears unticked on existing Checklists", async ({ db }) => {
    const { core, ana, entry, id, cv } = await applicationWithRequirements(db);
    const bo = await addMember(db, { name: "Bo" });
    const bosId = await core.startApplication(bo.id, entry);
    await core.tickRequirement(ana.id, id, cv, true);

    const ielts = await core.addRequirement(bo.id, entry, { label: "IELTS", note: "≥ 6.5" });

    for (const [member, application] of [
      [ana.id, id],
      [bo.id, bosId],
    ] as const) {
      expect((await core.getChecklist(member, application))?.requirements.at(-1)).toEqual({
        id: ielts,
        label: "IELTS",
        note: "≥ 6.5",
        ticked: false,
      });
    }
    expect((await core.getChecklist(ana.id, id))?.progress).toEqual({ done: 1, total: 3 });
  });

  test("an edited Requirement keeps its tick", async ({ db }) => {
    const { core, ana, id, cv } = await applicationWithRequirements(db);
    await core.tickRequirement(ana.id, id, cv, true);

    await core.editRequirement(ana.id, cv, { label: "CV (Europass)" });

    expect((await core.getChecklist(ana.id, id))?.requirements[0]).toEqual({
      id: cv,
      label: "CV (Europass)",
      note: null,
      ticked: true,
    });
  });

  test("a removed Requirement disappears, and its tick with it", async ({ db }) => {
    const { core, ana, entry, id, cv, references } = await applicationWithRequirements(db);
    await core.tickRequirement(ana.id, id, cv, true);
    await core.tickRequirement(ana.id, id, references, true);

    await core.removeRequirement(ana.id, references);
    expect(await core.getChecklist(ana.id, id)).toMatchObject({
      requirements: [{ id: cv, ticked: true }],
      progress: { done: 1, total: 1 },
    });

    // Adding it back is a new Requirement: nothing carries over.
    const again = await core.addRequirement(ana.id, entry, { label: "Reference letters" });
    expect(await core.getChecklist(ana.id, id)).toMatchObject({
      requirements: [
        { id: cv, ticked: true },
        { id: again, ticked: false },
      ],
      progress: { done: 1, total: 2 },
    });
  });
});

describe("Personal items", () => {
  test("follow the Requirements in the order added, and count towards progress", async ({
    db,
  }) => {
    const { core, ana, id, cv } = await applicationWithRequirements(db);

    const ask = await core.addPersonalItem(ana.id, id, "  Ask Prof. X for reference by 20 Nov ");
    const book = await core.addPersonalItem(ana.id, id, "Book IELTS");
    await core.tickPersonalItem(ana.id, book, true);
    await core.tickRequirement(ana.id, id, cv, true);

    expect(await core.getChecklist(ana.id, id)).toMatchObject({
      requirements: [{ id: cv }, {}],
      personalItems: [
        { id: ask, label: "Ask Prof. X for reference by 20 Nov", ticked: false },
        { id: book, label: "Book IELTS", ticked: true },
      ],
      progress: { done: 2, total: 4 },
    });
  });

  test("can be edited, unticked and deleted", async ({ db }) => {
    const { core, ana, id } = await applicationWithRequirements(db);
    const ask = await core.addPersonalItem(ana.id, id, "Ask Prof. X");
    const book = await core.addPersonalItem(ana.id, id, "Book IELTS");
    await core.tickPersonalItem(ana.id, ask, true);

    await core.editPersonalItem(ana.id, ask, "Ask Prof. Y instead");
    await core.tickPersonalItem(ana.id, ask, false);
    await core.deletePersonalItem(ana.id, book);
    await core.deletePersonalItem(ana.id, book);

    expect(await core.getChecklist(ana.id, id)).toMatchObject({
      personalItems: [{ id: ask, label: "Ask Prof. Y instead", ticked: false }],
      progress: { done: 0, total: 3 },
    });
  });

  test("need a label", async ({ db }) => {
    const { core, ana, id } = await applicationWithRequirements(db);
    const ask = await core.addPersonalItem(ana.id, id, "Ask Prof. X");

    await expect(core.addPersonalItem(ana.id, id, "  ")).rejects.toThrow(
      new InvalidInputError("A Personal item needs a label."),
    );
    await expect(core.editPersonalItem(ana.id, ask, "")).rejects.toThrow(
      new InvalidInputError("A Personal item needs a label."),
    );
    expect((await core.getChecklist(ana.id, id))?.personalItems).toEqual([
      { id: ask, label: "Ask Prof. X", ticked: false },
    ]);
  });

  test("are the whole Checklist when the entry has no Requirements", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const id = await core.startApplication(ana.id, programmeEntry(programmeId));
    expect(await core.getChecklist(ana.id, id)).toEqual({
      requirements: [],
      personalItems: [],
      progress: { done: 0, total: 0 },
    });

    const item = await core.addPersonalItem(ana.id, id, "Find a second referee");
    await core.tickPersonalItem(ana.id, item, true);

    expect((await core.getChecklist(ana.id, id))?.progress).toEqual({ done: 1, total: 1 });
  });
});

describe("a Checklist's privacy", () => {
  test("each Member's ticks and Personal items are their own", async ({ db }) => {
    const { core, ana, entry, id, cv } = await applicationWithRequirements(db);
    const bo = await addMember(db, { name: "Bo" });
    const bosId = await core.startApplication(bo.id, entry);

    await core.tickRequirement(ana.id, id, cv, true);
    await core.addPersonalItem(ana.id, id, "Ask Prof. X");

    expect(await core.getChecklist(bo.id, bosId)).toMatchObject({
      requirements: [{ id: cv, ticked: false }, { ticked: false }],
      personalItems: [],
      progress: { done: 0, total: 2 },
    });
  });

  test("another Member can't read or change it, and it's as if it isn't there", async ({ db }) => {
    const { core, ana, id, cv } = await applicationWithRequirements(db);
    const bo = await addMember(db, { name: "Bo" });
    const ask = await core.addPersonalItem(ana.id, id, "Ask Prof. X");
    const before = await core.getChecklist(ana.id, id);
    const notFound = new NotFoundError("That Application no longer exists.");

    expect(await core.getChecklist(bo.id, id)).toBeNull();
    await expect(core.tickRequirement(bo.id, id, cv, true)).rejects.toThrow(notFound);
    await expect(core.addPersonalItem(bo.id, id, "Mine now")).rejects.toThrow(notFound);
    await expect(core.editPersonalItem(bo.id, ask, "Mine now")).rejects.toThrow(
      new NotFoundError("That Personal item no longer exists."),
    );
    await expect(core.tickPersonalItem(bo.id, ask, true)).rejects.toThrow(
      new NotFoundError("That Personal item no longer exists."),
    );
    await core.deletePersonalItem(bo.id, ask);

    expect(await core.getChecklist(ana.id, id)).toEqual(before);
  });

  test("goes when its Application is deleted", async ({ db }) => {
    const { core, ana, entry, id, cv } = await applicationWithRequirements(db);
    await core.tickRequirement(ana.id, id, cv, true);
    const ask = await core.addPersonalItem(ana.id, id, "Ask Prof. X");

    await core.deleteApplication(ana.id, id);
    const again = await core.startApplication(ana.id, entry);

    expect(await core.getChecklist(ana.id, id)).toBeNull();
    expect(await core.getChecklist(ana.id, again)).toMatchObject({
      requirements: [{ id: cv, ticked: false }, { ticked: false }],
      personalItems: [],
    });
    await expect(core.tickPersonalItem(ana.id, ask, true)).rejects.toThrow(NotFoundError);
  });
});

describe("ticking a Requirement that isn't on the Checklist", () => {
  test("is refused when it belongs to another entry or has been removed", async ({ db }) => {
    const { core, ana, id } = await applicationWithRequirements(db);
    const otherProgramme = await core.addProgramme(ana.id, { ...robotics, name: "MSc AI" });
    const elsewhere = await core.addRequirement(ana.id, programmeEntry(otherProgramme), {
      label: "Portfolio",
    });
    const removed = await core.addRequirement(ana.id, (await core.getApplication(ana.id, id))!.entry, {
      label: "Passport copy",
    });
    await core.removeRequirement(ana.id, removed);
    const before = await core.getChecklist(ana.id, id);
    const notFound = new NotFoundError("That Requirement no longer exists.");

    await expect(core.tickRequirement(ana.id, id, elsewhere, true)).rejects.toThrow(notFound);
    await expect(core.tickRequirement(ana.id, id, removed, true)).rejects.toThrow(notFound);
    await expect(core.tickRequirement(ana.id, id, 2 ** 31, true)).rejects.toThrow(notFound);

    expect(await core.getChecklist(ana.id, id)).toEqual(before);
  });
});

describe("ids that aren't ones", () => {
  test("read as null and can't be changed", async ({ db }) => {
    const { core, ana, id, cv } = await applicationWithRequirements(db);

    expect(await core.getChecklist(ana.id, 2 ** 31)).toBeNull();
    await expect(core.tickRequirement(ana.id, 2 ** 31, cv, true)).rejects.toThrow(NotFoundError);
    await expect(core.addPersonalItem(ana.id, 404, "x")).rejects.toThrow(NotFoundError);
    await expect(core.editPersonalItem(ana.id, 2 ** 31, "x")).rejects.toThrow(NotFoundError);
    await expect(core.tickPersonalItem(ana.id, 404, true)).rejects.toThrow(NotFoundError);
    await expect(core.deletePersonalItem(ana.id, 2 ** 31)).resolves.toBeUndefined();
    expect((await core.getChecklist(ana.id, id))?.progress).toEqual({ done: 0, total: 2 });
  });
});
