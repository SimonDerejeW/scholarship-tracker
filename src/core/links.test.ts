import { describe, expect } from "vitest";
import { createCore, InvalidInputError, NotFoundError, type Db } from "@/core";
import { addMember, programmeEntry, scholarshipEntry, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

/** A Member with an Application to a Programme and one to a Scholarship. */
async function withApplications(db: Db) {
  const core = setup(db);
  const ana = await addMember(db, { name: "Ana" });
  const programmeId = await core.addProgramme(ana.id, {
    name: "MSc Robotics",
    university: "TU Delft",
    fundingIncluded: false,
  });
  const scholarshipId = await core.addScholarship(ana.id, { name: "Chevening", provider: "FCDO" });
  const robotics = await core.startApplication(ana.id, programmeEntry(programmeId));
  const chevening = await core.startApplication(ana.id, scholarshipEntry(scholarshipId));
  return { core, ana, programmeId, scholarshipId, robotics, chevening };
}

describe("linking a Scholarship Application to a Programme Application", () => {
  test("each Application points to the other", async ({ db }) => {
    const { core, ana, programmeId, scholarshipId, robotics, chevening } =
      await withApplications(db);

    await core.linkApplication(ana.id, chevening, robotics);

    expect(await core.getApplication(ana.id, chevening)).toMatchObject({
      funds: {
        id: robotics,
        stage: "Interested",
        entry: { kind: "programme", id: programmeId, name: "MSc Robotics", detail: "TU Delft" },
      },
      fundedBy: [],
    });
    expect(await core.getApplication(ana.id, robotics)).toMatchObject({
      funds: null,
      fundedBy: [
        {
          id: chevening,
          stage: "Interested",
          entry: { kind: "scholarship", id: scholarshipId, name: "Chevening", detail: "FCDO" },
        },
      ],
    });
  });
});

describe("what can be linked", () => {
  test("only a Scholarship Application can name an Application it would fund", async ({ db }) => {
    const { core, ana, robotics, chevening } = await withApplications(db);
    const ai = await core.startApplication(
      ana.id,
      programmeEntry(
        await core.addProgramme(ana.id, { name: "MSc AI", university: "KTH", fundingIncluded: false }),
      ),
    );

    await expect(core.linkApplication(ana.id, robotics, ai)).rejects.toThrow(
      new InvalidInputError("Only a Scholarship Application can be linked to a Programme Application."),
    );
    expect(await core.getApplication(ana.id, robotics)).toMatchObject({ funds: null });
    expect(await core.getApplication(ana.id, chevening)).toMatchObject({ funds: null });
  });

  test("only to a Programme Application", async ({ db }) => {
    const { core, ana, chevening } = await withApplications(db);
    const daad = await core.startApplication(
      ana.id,
      scholarshipEntry(await core.addScholarship(ana.id, { name: "DAAD", provider: "DAAD" })),
    );

    await expect(core.linkApplication(ana.id, chevening, daad)).rejects.toThrow(
      new InvalidInputError("Pick one of your Programme Applications."),
    );
    expect(await core.getApplication(ana.id, chevening)).toMatchObject({ funds: null });
  });

  test("only to the same Member's, and only by that Member", async ({ db }) => {
    const { core, ana, programmeId, robotics, chevening } = await withApplications(db);
    const bo = await addMember(db, { name: "Bo" });
    const theirRobotics = await core.startApplication(bo.id, programmeEntry(programmeId));

    await expect(core.linkApplication(ana.id, chevening, theirRobotics)).rejects.toThrow(
      new NotFoundError("That Application no longer exists."),
    );
    await expect(core.linkApplication(bo.id, chevening, theirRobotics)).rejects.toThrow(
      new NotFoundError("That Application no longer exists."),
    );
    expect(await core.getApplication(ana.id, chevening)).toMatchObject({ funds: null });
    expect(await core.getApplication(bo.id, theirRobotics)).toMatchObject({ fundedBy: [] });

    await core.linkApplication(ana.id, chevening, robotics);
    expect(await core.getApplication(bo.id, theirRobotics)).toMatchObject({ fundedBy: [] });
  });

  test("linking again replaces the Programme Application it names", async ({ db }) => {
    const { core, ana, robotics, chevening } = await withApplications(db);
    const ai = await core.startApplication(
      ana.id,
      programmeEntry(
        await core.addProgramme(ana.id, { name: "MSc AI", university: "KTH", fundingIncluded: false }),
      ),
    );
    await core.linkApplication(ana.id, chevening, robotics);

    await core.linkApplication(ana.id, chevening, ai);

    expect(await core.getApplication(ana.id, chevening)).toMatchObject({
      funds: { id: ai, entry: { name: "MSc AI" } },
    });
    expect(await core.getApplication(ana.id, robotics)).toMatchObject({ fundedBy: [] });
  });
});

describe("unlinking", () => {
  test("leaves both Applications unlinked", async ({ db }) => {
    const { core, ana, robotics, chevening } = await withApplications(db);
    await core.linkApplication(ana.id, chevening, robotics);

    await core.unlinkApplication(ana.id, chevening);

    expect(await core.getApplication(ana.id, chevening)).toMatchObject({ funds: null });
    expect(await core.getApplication(ana.id, robotics)).toMatchObject({ fundedBy: [] });
  });

  test("another Member's Application reads as not found", async ({ db }) => {
    const { core, ana, robotics, chevening } = await withApplications(db);
    const bo = await addMember(db, { name: "Bo" });
    await core.linkApplication(ana.id, chevening, robotics);

    await expect(core.unlinkApplication(bo.id, chevening)).rejects.toThrow(
      new NotFoundError("That Application no longer exists."),
    );
    expect(await core.getApplication(ana.id, chevening)).toMatchObject({ funds: { id: robotics } });
  });
});

describe("deleting a linked Application", () => {
  test("deleting the Programme Application clears the link and keeps the Scholarship one", async ({
    db,
  }) => {
    const { core, ana, robotics, chevening } = await withApplications(db);
    await core.linkApplication(ana.id, chevening, robotics);

    await core.deleteApplication(ana.id, robotics);

    expect(await core.getApplication(ana.id, chevening)).toMatchObject({
      stage: "Interested",
      funds: null,
    });
  });

  test("deleting the Scholarship Application leaves the Programme one unlinked", async ({ db }) => {
    const { core, ana, robotics, chevening } = await withApplications(db);
    await core.linkApplication(ana.id, chevening, robotics);

    await core.deleteApplication(ana.id, chevening);

    expect(await core.getApplication(ana.id, robotics)).toMatchObject({ fundedBy: [] });
  });
});

describe("linked Applications on Upcoming", () => {
  /** Ana's Applications, each to an entry with one Deadline on this date. */
  async function withDeadlines(
    db: Db,
    programmes: Record<string, string>,
    scholarships: Record<string, string>,
  ) {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const ids: Record<string, number> = {};
    for (const [name, date] of Object.entries(programmes)) {
      const entry = programmeEntry(
        await core.addProgramme(ana.id, { name, university: "TU Delft", fundingIncluded: false }),
      );
      await core.addDeadline(ana.id, entry, { label: "Final", date });
      ids[name] = await core.startApplication(ana.id, entry);
    }
    for (const [name, date] of Object.entries(scholarships)) {
      const entry = scholarshipEntry(await core.addScholarship(ana.id, { name, provider: "FCDO" }));
      await core.addDeadline(ana.id, entry, { label: "Final", date });
      ids[name] = await core.startApplication(ana.id, entry);
    }
    return { core, ana, ids };
  }

  const rows = (list: { entry: { name: string }; fundsApplicationId: number | null }[]) =>
    list.map((row) => [row.entry.name, row.fundsApplicationId]);

  test("a Scholarship Application follows the Programme Application it would fund", async ({
    db,
  }) => {
    const { core, ana, ids } = await withDeadlines(
      db,
      { "MSc Robotics": "2026-11-10", "MSc AI": "2026-12-01" },
      { Chevening: "2027-02-01", DAAD: "2026-11-20" },
    );
    await core.linkApplication(ana.id, ids.Chevening, ids["MSc Robotics"]);

    expect(rows(await core.upcoming(ana.id, "2026-11-03", "open"))).toEqual([
      ["MSc Robotics", null],
      ["Chevening", ids["MSc Robotics"]],
      ["DAAD", null],
      ["MSc AI", null],
    ]);
  });

  test("the pair sits where the sooner of the two would", async ({ db }) => {
    const { core, ana, ids } = await withDeadlines(
      db,
      { "MSc Robotics": "2027-01-15", "MSc AI": "2026-12-01" },
      { Chevening: "2026-11-10", "Holland Scholarship": "2026-11-12" },
    );
    await core.linkApplication(ana.id, ids.Chevening, ids["MSc Robotics"]);
    await core.linkApplication(ana.id, ids["Holland Scholarship"], ids["MSc Robotics"]);

    expect(rows(await core.upcoming(ana.id, "2026-11-03", "open"))).toEqual([
      ["MSc Robotics", null],
      ["Chevening", ids["MSc Robotics"]],
      ["Holland Scholarship", ids["MSc Robotics"]],
      ["MSc AI", null],
    ]);
  });

  test("when the Programme Application isn't shown, the Scholarship one stands alone", async ({
    db,
  }) => {
    const { core, ana, ids } = await withDeadlines(
      db,
      { "MSc Robotics": "2026-11-10" },
      { Chevening: "2027-02-01" },
    );
    await core.linkApplication(ana.id, ids.Chevening, ids["MSc Robotics"]);
    await core.setStage(ana.id, ids["MSc Robotics"], "Withdrawn");

    expect(rows(await core.upcoming(ana.id, "2026-11-03", "open"))).toEqual([["Chevening", null]]);
  });
});

describe("the Programme Applications a Scholarship Application can link to", () => {
  test("are the Member's own Programme Applications, by name", async ({ db }) => {
    const { core, ana, programmeId, robotics } = await withApplications(db);
    const bo = await addMember(db, { name: "Bo" });
    await core.startApplication(bo.id, programmeEntry(programmeId));
    const ai = await core.startApplication(
      ana.id,
      programmeEntry(
        await core.addProgramme(ana.id, { name: "MSc AI", university: "KTH", fundingIncluded: false }),
      ),
    );
    await core.setStage(ana.id, ai, "Withdrawn");

    expect(await core.programmeApplications(ana.id)).toEqual([
      {
        id: ai,
        stage: "Withdrawn",
        entry: { kind: "programme", id: expect.any(Number), name: "MSc AI", detail: "KTH" },
      },
      {
        id: robotics,
        stage: "Interested",
        entry: { kind: "programme", id: programmeId, name: "MSc Robotics", detail: "TU Delft" },
      },
    ]);
  });
});
