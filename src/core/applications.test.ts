import { describe, expect } from "vitest";
import { createCore, InvalidInputError, NotFoundError, type Db } from "@/core";
import { addMember, programmeEntry, scholarshipEntry, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

const robotics = { name: "MSc Robotics", university: "TU Delft", fundingIncluded: false };
const daad = { name: "DAAD Study Scholarship", provider: "DAAD" };
const today = "2026-11-03";

describe("starting an Application", () => {
  test("to a Programme begins at Interested, with no notes and unlinked", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);

    const id = await core.startApplication(ana.id, programmeEntry(programmeId));

    expect(await core.getApplication(ana.id, id)).toEqual({
      id,
      stage: "Interested",
      notes: null,
      entry: { kind: "programme", id: programmeId, name: "MSc Robotics", detail: "TU Delft" },
      funds: null,
      fundedBy: [],
    });
  });
});

describe("one Application per Catalog entry", () => {
  test("starting a second to the same entry is refused", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const scholarshipId = await core.addScholarship(ana.id, daad);
    await core.startApplication(ana.id, programmeEntry(programmeId));
    await core.startApplication(ana.id, scholarshipEntry(scholarshipId));

    await expect(core.startApplication(ana.id, programmeEntry(programmeId))).rejects.toThrow(
      new InvalidInputError("You already have an Application to this Programme."),
    );
    await expect(core.startApplication(ana.id, scholarshipEntry(scholarshipId))).rejects.toThrow(
      new InvalidInputError("You already have an Application to this Scholarship."),
    );
    expect(await core.upcoming(ana.id, today, "all")).toHaveLength(2);
  });

  test("a Programme and a Scholarship sharing an id are different entries", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const scholarshipId = await core.addScholarship(ana.id, daad);
    expect(scholarshipId).toBe(programmeId);

    await core.startApplication(ana.id, programmeEntry(programmeId));
    const id = await core.startApplication(ana.id, scholarshipEntry(scholarshipId));

    expect(await core.getApplication(ana.id, id)).toMatchObject({
      entry: {
        kind: "scholarship",
        id: scholarshipId,
        name: "DAAD Study Scholarship",
        detail: "DAAD",
      },
    });
  });

  test("each Member may have their own Application to the same entry", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const programmeId = await core.addProgramme(ana.id, robotics);

    await core.startApplication(ana.id, programmeEntry(programmeId));
    await core.startApplication(bo.id, programmeEntry(programmeId));

    expect(await core.upcoming(bo.id, today, "all")).toMatchObject([
      { stage: "Interested", entry: { name: "MSc Robotics" } },
    ]);
  });
});

describe("starting an Application to an entry that doesn't exist", () => {
  test("is refused", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    await expect(core.startApplication(ana.id, programmeEntry(404))).rejects.toThrow(
      new NotFoundError("That Programme no longer exists."),
    );
    await expect(core.startApplication(ana.id, scholarshipEntry(404))).rejects.toThrow(
      new NotFoundError("That Scholarship no longer exists."),
    );
  });
});

describe("an Application's Stage", () => {
  test("can be set to any Stage from any Stage", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const id = await core.startApplication(ana.id, programmeEntry(programmeId));

    const stages = [];
    for (const stage of ["Accepted", "Interested", "Interview", "Withdrawn", "Preparing"]) {
      await core.setStage(ana.id, id, stage);
      stages.push((await core.getApplication(ana.id, id))?.stage);
    }
    await core.setStage(ana.id, id, "Submitted");
    await core.setStage(ana.id, id, "Rejected");

    expect(stages).toEqual(["Accepted", "Interested", "Interview", "Withdrawn", "Preparing"]);
    expect((await core.getApplication(ana.id, id))?.stage).toBe("Rejected");
  });

  test("must be one of the Stages", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const id = await core.startApplication(ana.id, programmeEntry(programmeId));

    await expect(core.setStage(ana.id, id, "Expired")).rejects.toThrow(
      new InvalidInputError("Pick a Stage."),
    );
    expect((await core.getApplication(ana.id, id))?.stage).toBe("Interested");
  });
});

describe("an Application's notes", () => {
  test("are kept trimmed, and cleared when blank", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const id = await core.startApplication(ana.id, programmeEntry(programmeId));

    await core.editApplicationNotes(ana.id, id, "  Portal login: my uni email\n");
    expect((await core.getApplication(ana.id, id))?.notes).toBe("Portal login: my uni email");

    await core.editApplicationNotes(ana.id, id, " \n ");
    expect((await core.getApplication(ana.id, id))?.notes).toBeNull();
  });
});

describe("deleting an Application", () => {
  test("stops tracking the entry, so it can be started again", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const id = await core.startApplication(ana.id, programmeEntry(programmeId));
    await core.setStage(ana.id, id, "Preparing");

    await core.deleteApplication(ana.id, id);

    expect(await core.getApplication(ana.id, id)).toBeNull();
    expect(await core.upcoming(ana.id, today, "all")).toEqual([]);
    expect(await core.applicationTo(ana.id, programmeEntry(programmeId))).toBeNull();
    const again = await core.startApplication(ana.id, programmeEntry(programmeId));
    expect((await core.getApplication(ana.id, again))?.stage).toBe("Interested");
  });

  test("deleting one that's already gone does nothing", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    await expect(core.deleteApplication(ana.id, 404)).resolves.toBeUndefined();
  });
});

describe("whether a Member is tracking a Catalog entry", () => {
  test("gives their Application to it, or null", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const scholarshipId = await core.addScholarship(ana.id, daad);
    const id = await core.startApplication(ana.id, programmeEntry(programmeId));
    await core.setStage(ana.id, id, "Submitted");

    expect(await core.applicationTo(ana.id, programmeEntry(programmeId))).toEqual({
      id,
      stage: "Submitted",
    });
    expect(await core.applicationTo(ana.id, scholarshipEntry(scholarshipId))).toBeNull();
  });
});

describe("an Application's privacy", () => {
  test("another Member can't read, change or delete it, and it's as if it isn't there", async ({
    db,
  }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const id = await core.startApplication(ana.id, programmeEntry(programmeId));
    await core.setStage(ana.id, id, "Preparing");
    await core.editApplicationNotes(ana.id, id, "Ask Prof. X");

    expect(await core.getApplication(bo.id, id)).toBeNull();
    expect(await core.upcoming(bo.id, today, "all")).toEqual([]);
    expect(await core.applicationTo(bo.id, programmeEntry(programmeId))).toBeNull();
    await expect(core.setStage(bo.id, id, "Withdrawn")).rejects.toThrow(
      new NotFoundError("That Application no longer exists."),
    );
    await expect(core.editApplicationNotes(bo.id, id, "")).rejects.toThrow(
      new NotFoundError("That Application no longer exists."),
    );
    await core.deleteApplication(bo.id, id);

    expect(await core.getApplication(ana.id, id)).toMatchObject({
      stage: "Preparing",
      notes: "Ask Prof. X",
    });
  });

  test("Catalog pages show nothing of it", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const scholarshipId = await core.addScholarship(ana.id, daad);
    const catalog = () =>
      Promise.all([
        core.getProgramme(bo.id, programmeId),
        core.getScholarship(bo.id, scholarshipId),
        core.searchCatalog(bo.id, "", "2027-01-01"),
      ]);
    const before = await catalog();

    await core.startApplication(ana.id, programmeEntry(programmeId));
    await core.startApplication(ana.id, scholarshipEntry(scholarshipId));

    expect(await catalog()).toEqual(before);
  });
});

describe("an Application id that isn't one", () => {
  test("reads as null and can't be changed", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    expect(await core.getApplication(ana.id, 2 ** 31)).toBeNull();
    await expect(core.setStage(ana.id, 2 ** 31, "Preparing")).rejects.toThrow(NotFoundError);
    await expect(core.editApplicationNotes(ana.id, 404, "x")).rejects.toThrow(NotFoundError);
  });
});
