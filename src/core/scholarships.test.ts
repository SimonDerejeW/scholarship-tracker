import { describe, expect } from "vitest";
import { createCore, InvalidInputError, NotFoundError, type Db } from "@/core";
import { addMember, programmeEntry, scholarshipEntry, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

const daad = {
  name: "DAAD Study Scholarship",
  provider: "DAAD",
  link: "https://example.org/daad",
  coverage: "€992 a month, health insurance, travel allowance",
  notes: "Apply via the DAAD portal",
};

describe("adding a Scholarship", () => {
  test("records its fields and the Member who added it", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    const id = await core.addScholarship(ana.id, daad);

    expect(await core.getScholarship(ana.id, id)).toMatchObject({
      id,
      ...daad,
      addedBy: { id: ana.id, name: "Ana" },
      deadlines: [],
      requirements: [],
    });
  });
});

describe("a Scholarship's Deadlines and Requirements", () => {
  test("a Scholarship may have no Deadlines", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    const id = await core.addScholarship(ana.id, daad);

    expect((await core.getScholarship(ana.id, id))?.deadlines).toEqual([]);
  });

  test("any Member may add, edit and remove them", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const id = await core.addScholarship(ana.id, daad);
    const entry = scholarshipEntry(id);

    const final = await core.addDeadline(bo.id, entry, { label: "Final", date: "2027-10-15" });
    await core.addDeadline(bo.id, entry, { label: "Portal opens", date: "2027-08-01" });
    const cv = await core.addRequirement(bo.id, entry, { label: "CV" });
    const ielts = await core.addRequirement(bo.id, entry, { label: "IELTS", note: "≥ 6.5" });
    await core.editDeadline(ana.id, final, { label: "Final, 23:59 CET", date: "2027-10-31" });
    await core.editRequirement(ana.id, ielts, { label: "IELTS or TOEFL", note: null });
    await core.removeRequirement(ana.id, cv);

    expect(await core.getScholarship(ana.id, id)).toMatchObject({
      deadlines: [
        { label: "Portal opens", date: "2027-08-01" },
        { label: "Final, 23:59 CET", date: "2027-10-31" },
      ],
      requirements: [{ label: "IELTS or TOEFL", note: null }],
    });
  });

  test("are kept apart from a Programme's with the same id", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const scholarshipId = await core.addScholarship(ana.id, daad);
    const programmeId = await core.addProgramme(ana.id, {
      name: "MSc Robotics",
      university: "TU Delft",
      fundingIncluded: false,
    });
    expect(scholarshipId).toBe(programmeId);

    await core.addDeadline(ana.id, scholarshipEntry(scholarshipId), {
      label: "Final",
      date: "2027-10-15",
    });
    await core.addRequirement(ana.id, programmeEntry(programmeId), { label: "CV" });

    expect(await core.getScholarship(ana.id, scholarshipId)).toMatchObject({
      deadlines: [{ label: "Final" }],
      requirements: [],
    });
    expect(await core.getProgramme(ana.id, programmeId)).toMatchObject({
      deadlines: [],
      requirements: [{ label: "CV" }],
    });
  });
});

describe("Scholarship input", () => {
  test("needs a name and a provider", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    await expect(core.addScholarship(ana.id, { ...daad, name: " " })).rejects.toThrow(
      new InvalidInputError("A Scholarship needs a name."),
    );
    await expect(core.addScholarship(ana.id, { ...daad, provider: "" })).rejects.toThrow(
      new InvalidInputError("A Scholarship needs a provider."),
    );
    expect((await core.searchCatalog(ana.id, "", "2027-01-01")).scholarships).toEqual([]);
  });

  test("trims text, leaves blank optional fields empty, and only takes a web address as the link", async ({
    db,
  }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    await expect(
      core.addScholarship(ana.id, { ...daad, link: "javascript:alert(1)" }),
    ).rejects.toThrow(
      new InvalidInputError("The link must be a web address starting with http:// or https://."),
    );
    const id = await core.addScholarship(ana.id, {
      name: " Chevening ",
      provider: " FCDO",
      link: "",
      coverage: "  ",
      notes: " \n ",
    });

    expect(await core.getScholarship(ana.id, id)).toMatchObject({
      name: "Chevening",
      provider: "FCDO",
      link: null,
      coverage: null,
      notes: null,
    });
  });
});

describe("editing a Scholarship", () => {
  test("any Member may edit one another Member added; the adder stays recorded", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const id = await core.addScholarship(ana.id, daad);

    const corrected = {
      name: "DAAD Study Scholarship for Graduates",
      provider: "German Academic Exchange Service",
      link: "https://example.org/daad-graduates",
      coverage: "€992 a month",
      notes: null,
    };
    await core.editScholarship(bo.id, id, corrected);

    expect(await core.getScholarship(bo.id, id)).toMatchObject({
      ...corrected,
      addedBy: { id: ana.id, name: "Ana" },
    });
  });
});

describe("the Catalog's Scholarships", () => {
  test("lists every Member's Scholarships, by name", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    await core.addScholarship(ana.id, { name: "DAAD Study Scholarship", provider: "DAAD" });
    await core.addScholarship(bo.id, {
      name: "chevening",
      provider: "FCDO",
      coverage: "Tuition and living costs",
    });

    expect((await core.searchCatalog(bo.id, "", "2027-01-01")).scholarships).toMatchObject([
      { name: "chevening", provider: "FCDO", coverage: "Tuition and living costs" },
      { name: "DAAD Study Scholarship", provider: "DAAD", coverage: null },
    ]);
  });

  test("shows each Scholarship's next Deadline, soonest first", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const daadId = await core.addScholarship(ana.id, daad);
    const chevening = await core.addScholarship(ana.id, { name: "Chevening", provider: "FCDO" });
    await core.addDeadline(ana.id, scholarshipEntry(daadId), {
      label: "Final",
      date: "2027-10-15",
    });
    await core.addDeadline(ana.id, scholarshipEntry(chevening), {
      label: "Final, 12:00 GMT",
      date: "2027-11-04",
    });

    expect((await core.searchCatalog(ana.id, "", "2027-10-16")).scholarships).toMatchObject([
      { name: "Chevening", nextDeadline: { label: "Final, 12:00 GMT", date: "2027-11-04" } },
      { name: "DAAD Study Scholarship", nextDeadline: null, deadlinesPassed: true },
    ]);
  });
});

describe("a Scholarship that doesn't exist", () => {
  test("reads as null and can't be edited or added to", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const missing = scholarshipEntry(404);

    expect(await core.getScholarship(ana.id, 404)).toBeNull();
    expect(await core.getScholarship(ana.id, 2 ** 31)).toBeNull();
    await expect(core.editScholarship(ana.id, 404, daad)).rejects.toThrow(
      new NotFoundError("That Scholarship no longer exists."),
    );
    await expect(
      core.addDeadline(ana.id, missing, { label: "Final", date: "2027-10-15" }),
    ).rejects.toThrow(new NotFoundError("That Scholarship no longer exists."));
    await expect(core.addRequirement(ana.id, missing, { label: "CV" })).rejects.toThrow(
      NotFoundError,
    );
  });
});
