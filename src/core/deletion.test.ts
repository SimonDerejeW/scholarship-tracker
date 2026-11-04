import { describe, expect } from "vitest";
import { createCore, NotAllowedError, NotFoundError, type Db } from "@/core";
import { addMember, programmeEntry, scholarshipEntry, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

const robotics = { name: "MSc Robotics", university: "TU Delft", fundingIncluded: false };
const daad = { name: "DAAD Study Scholarship", provider: "DAAD" };

describe("deleting a Catalog entry", () => {
  test("the Member who added a Programme may delete it, with its Deadlines and Requirements", async ({
    db,
  }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addProgramme(ana.id, robotics);
    const final = await core.addDeadline(ana.id, programmeEntry(id), {
      label: "Final",
      date: "2027-03-01",
    });
    const cv = await core.addRequirement(ana.id, programmeEntry(id), { label: "CV" });

    await core.deleteCatalogEntry(ana.id, programmeEntry(id));

    expect(await core.getProgramme(ana.id, id)).toBeNull();
    expect((await core.searchCatalog(ana.id, "", "2027-01-01")).programmes).toEqual([]);
    await expect(
      core.editDeadline(ana.id, final, { label: "Final", date: "2027-03-01" }),
    ).rejects.toThrow(NotFoundError);
    await expect(core.editRequirement(ana.id, cv, { label: "CV" })).rejects.toThrow(NotFoundError);
  });

  test("another Member may not delete it, and it stays in the Catalog", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const scholarshipId = await core.addScholarship(ana.id, daad);

    await expect(core.deleteCatalogEntry(bo.id, programmeEntry(programmeId))).rejects.toThrow(
      new NotAllowedError("Only the Member who added this Programme can delete it."),
    );
    await expect(core.deleteCatalogEntry(bo.id, scholarshipEntry(scholarshipId))).rejects.toThrow(
      new NotAllowedError("Only the Member who added this Scholarship can delete it."),
    );
    expect(await core.getProgramme(bo.id, programmeId)).not.toBeNull();
    expect(await core.getScholarship(bo.id, scholarshipId)).not.toBeNull();
  });

  test("not even its adder may delete it while any Member has an Application to it, and nobody is named", async ({
    db,
  }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const scholarshipId = await core.addScholarship(ana.id, daad);
    await core.startApplication(bo.id, programmeEntry(programmeId));
    await core.startApplication(bo.id, scholarshipEntry(scholarshipId));

    await expect(core.deleteCatalogEntry(ana.id, programmeEntry(programmeId))).rejects.toThrow(
      new NotAllowedError("This Programme can't be deleted while anyone has an Application to it."),
    );
    await expect(core.deleteCatalogEntry(ana.id, scholarshipEntry(scholarshipId))).rejects.toThrow(
      new NotAllowedError(
        "This Scholarship can't be deleted while anyone has an Application to it.",
      ),
    );
    expect(await core.getProgramme(ana.id, programmeId)).not.toBeNull();
    expect(await core.getScholarship(ana.id, scholarshipId)).not.toBeNull();
  });

  test("once the last Application to it is deleted, its adder may delete it", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addScholarship(ana.id, daad);
    const application = await core.startApplication(ana.id, scholarshipEntry(id));
    await expect(core.deleteCatalogEntry(ana.id, scholarshipEntry(id))).rejects.toThrow(
      NotAllowedError,
    );

    await core.deleteApplication(ana.id, application);
    await core.deleteCatalogEntry(ana.id, scholarshipEntry(id));

    expect(await core.getScholarship(ana.id, id)).toBeNull();
  });

  test("an entry that doesn't exist can't be deleted", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    await expect(core.deleteCatalogEntry(ana.id, programmeEntry(404))).rejects.toThrow(
      NotFoundError,
    );
    await expect(core.deleteCatalogEntry(ana.id, scholarshipEntry(2 ** 31))).rejects.toThrow(
      NotFoundError,
    );
  });
});
