import { describe, expect } from "vitest";
import { createCore, InvalidInputError, NotFoundError, type Db } from "@/core";
import { addMember, programmeEntry, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

const erasmus = {
  name: "MSc Data Science",
  university: "University of Lisbon",
  country: "Portugal",
  link: "https://example.edu/data-science",
  fundingIncluded: true,
  notes: "Erasmus Mundus joint degree",
};

describe("adding a Programme", () => {
  test("records its fields and the Member who added it", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    const id = await core.addProgramme(ana.id, erasmus);

    expect(await core.getProgramme(ana.id, id)).toMatchObject({
      id,
      ...erasmus,
      addedBy: { id: ana.id, name: "Ana" },
      deadlines: [],
      requirements: [],
    });
  });
});

describe("Deadlines", () => {
  test("a Programme may have no Deadlines", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    const id = await core.addProgramme(ana.id, erasmus);

    expect((await core.getProgramme(ana.id, id))?.deadlines).toEqual([]);
  });

  test("are listed by date, whatever order they were added in", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addProgramme(ana.id, erasmus);

    await core.addDeadline(ana.id, programmeEntry(id), {
      label: "Final, 12:00 CET",
      date: "2027-03-01",
    });
    await core.addDeadline(ana.id, programmeEntry(id), {
      label: "Scholarship priority",
      date: "2027-01-15",
    });

    const { deadlines } = (await core.getProgramme(ana.id, id))!;
    expect(deadlines.map(({ label, date }) => ({ label, date }))).toEqual([
      { label: "Scholarship priority", date: "2027-01-15" },
      { label: "Final, 12:00 CET", date: "2027-03-01" },
    ]);
  });

  test("any Member may edit a Deadline, which is re-ordered by its new date", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const id = await core.addProgramme(ana.id, erasmus);
    const first = await core.addDeadline(ana.id, programmeEntry(id), {
      label: "Round 1",
      date: "2027-01-15",
    });
    await core.addDeadline(ana.id, programmeEntry(id), { label: "Round 2", date: "2027-02-15" });

    await core.editDeadline(bo.id, first, { label: "Round 1 (extended)", date: "2027-03-01" });

    const { deadlines } = (await core.getProgramme(bo.id, id))!;
    expect(deadlines.map(({ label, date }) => ({ label, date }))).toEqual([
      { label: "Round 2", date: "2027-02-15" },
      { label: "Round 1 (extended)", date: "2027-03-01" },
    ]);
  });

  test("any Member may remove a Deadline", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const id = await core.addProgramme(ana.id, erasmus);
    const cancelled = await core.addDeadline(ana.id, programmeEntry(id), {
      label: "Round 1",
      date: "2027-01-15",
    });
    await core.addDeadline(ana.id, programmeEntry(id), { label: "Round 2", date: "2027-02-15" });

    await core.removeDeadline(bo.id, cancelled);

    const { deadlines } = (await core.getProgramme(bo.id, id))!;
    expect(deadlines.map(({ label }) => label)).toEqual(["Round 2"]);
  });
});

describe("another Member's Programme", () => {
  test("any Member may add Deadlines and Requirements to it", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const id = await core.addProgramme(ana.id, erasmus);

    await core.addDeadline(bo.id, programmeEntry(id), { label: "Final", date: "2027-01-15" });
    await core.addRequirement(bo.id, programmeEntry(id), { label: "CV" });

    expect(await core.getProgramme(ana.id, id)).toMatchObject({
      deadlines: [{ label: "Final", date: "2027-01-15" }],
      requirements: [{ label: "CV" }],
    });
  });
});

describe("Deadline input", () => {
  test("needs a label", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addProgramme(ana.id, erasmus);

    await expect(
      core.addDeadline(ana.id, programmeEntry(id), { label: " ", date: "2027-01-15" }),
    ).rejects.toThrow(new InvalidInputError("A Deadline needs a label."));
  });

  test("needs a real calendar date", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addProgramme(ana.id, erasmus);

    for (const date of ["", "2027-02-30", "15/01/2027", "2027-01-15T12:00"]) {
      await expect(
        core.addDeadline(ana.id, programmeEntry(id), { label: "Final", date }),
      ).rejects.toThrow(new InvalidInputError("A Deadline needs a date."));
    }
    await core.addDeadline(ana.id, programmeEntry(id), { label: "Final", date: "2028-02-29" });
    expect((await core.getProgramme(ana.id, id))?.deadlines).toMatchObject([
      { label: "Final", date: "2028-02-29" },
    ]);
  });
});

describe("Requirements", () => {
  test("are listed in the order they were added, each with an optional note", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addProgramme(ana.id, erasmus);

    await core.addRequirement(ana.id, programmeEntry(id), { label: "CV" });
    await core.addRequirement(ana.id, programmeEntry(id), {
      label: "Reference letters",
      note: "Two, academic",
    });
    await core.addRequirement(ana.id, programmeEntry(id), { label: "IELTS", note: "≥ 6.5" });

    const { requirements } = (await core.getProgramme(ana.id, id))!;
    expect(requirements.map(({ label, note }) => ({ label, note }))).toEqual([
      { label: "CV", note: null },
      { label: "Reference letters", note: "Two, academic" },
      { label: "IELTS", note: "≥ 6.5" },
    ]);
  });

  test("any Member may edit a Requirement", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const id = await core.addProgramme(ana.id, erasmus);
    const ielts = await core.addRequirement(ana.id, programmeEntry(id), {
      label: "IELTS",
      note: "≥ 6.5",
    });

    await core.editRequirement(bo.id, ielts, { label: "IELTS or TOEFL", note: null });

    const { requirements } = (await core.getProgramme(bo.id, id))!;
    expect(requirements.map(({ label, note }) => ({ label, note }))).toEqual([
      { label: "IELTS or TOEFL", note: null },
    ]);
  });

  test("any Member may remove a Requirement", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const id = await core.addProgramme(ana.id, erasmus);
    await core.addRequirement(ana.id, programmeEntry(id), { label: "CV" });
    const portfolio = await core.addRequirement(ana.id, programmeEntry(id), { label: "Portfolio" });

    await core.removeRequirement(bo.id, portfolio);

    const { requirements } = (await core.getProgramme(bo.id, id))!;
    expect(requirements.map(({ label }) => label)).toEqual(["CV"]);
  });

  test("need a label; a blank note is left empty", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addProgramme(ana.id, erasmus);

    await expect(
      core.addRequirement(ana.id, programmeEntry(id), { label: "", note: "Two" }),
    ).rejects.toThrow(new InvalidInputError("A Requirement needs a label."));
    await core.addRequirement(ana.id, programmeEntry(id), { label: " CV ", note: "  " });

    expect((await core.getProgramme(ana.id, id))?.requirements).toMatchObject([
      { label: "CV", note: null },
    ]);
  });
});

describe("Programme input", () => {
  test("needs a name and a university", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    await expect(core.addProgramme(ana.id, { ...erasmus, name: "  " })).rejects.toThrow(
      new InvalidInputError("A Programme needs a name."),
    );
    await expect(core.addProgramme(ana.id, { ...erasmus, university: "" })).rejects.toThrow(
      new InvalidInputError("A Programme needs a university."),
    );
    expect(await core.listProgrammes(ana.id)).toEqual([]);
  });

  test("trims text and leaves blank optional fields empty", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    const id = await core.addProgramme(ana.id, {
      name: "  MSc Robotics ",
      university: " TU Delft",
      country: "  ",
      link: "",
      fundingIncluded: false,
      notes: " \n ",
    });

    expect(await core.getProgramme(ana.id, id)).toMatchObject({
      name: "MSc Robotics",
      university: "TU Delft",
      country: null,
      link: null,
      notes: null,
    });
  });

  test("only accepts a web address as the link", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    for (const link of ["javascript:alert(1)", "example.edu/robotics", "ftp://example.edu"]) {
      await expect(core.addProgramme(ana.id, { ...erasmus, link })).rejects.toThrow(
        new InvalidInputError("The link must be a web address starting with http:// or https://."),
      );
    }
    const id = await core.addProgramme(ana.id, { ...erasmus, link: "http://example.edu/robotics" });
    expect((await core.getProgramme(ana.id, id))?.link).toBe("http://example.edu/robotics");
  });
});

describe("editing", () => {
  test("any Member may edit a Programme another Member added; the adder stays recorded", async ({
    db,
  }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const id = await core.addProgramme(ana.id, erasmus);

    const corrected = {
      name: "MSc Data Science & AI",
      university: "NOVA University Lisbon",
      country: "Portugal",
      link: "https://example.edu/dsai",
      fundingIncluded: false,
      notes: null,
    };
    await core.editProgramme(bo.id, id, corrected);

    expect(await core.getProgramme(bo.id, id)).toMatchObject({
      ...corrected,
      addedBy: { id: ana.id, name: "Ana" },
    });
  });
});

describe("the Catalog", () => {
  test("lists every Member's Programmes, by name", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    await core.addProgramme(ana.id, { ...erasmus, name: "MSc Robotics", university: "TU Delft" });
    await core.addProgramme(bo.id, {
      ...erasmus,
      name: "MSc artificial intelligence",
      university: "KU Leuven",
    });

    const programmes = await core.listProgrammes(ana.id);

    expect(programmes.map(({ name, university }) => ({ name, university }))).toEqual([
      { name: "MSc artificial intelligence", university: "KU Leuven" },
      { name: "MSc Robotics", university: "TU Delft" },
    ]);
  });
});

describe("something that doesn't exist", () => {
  test("a missing Programme reads as null and can't be edited or added to", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    expect(await core.getProgramme(ana.id, 404)).toBeNull();
    expect(await core.getProgramme(ana.id, 2 ** 31)).toBeNull();
    await expect(core.editProgramme(ana.id, 404, erasmus)).rejects.toThrow(NotFoundError);
    await expect(
      core.addDeadline(ana.id, programmeEntry(404), { label: "Final", date: "2027-01-15" }),
    ).rejects.toThrow(NotFoundError);
    await expect(core.addRequirement(ana.id, programmeEntry(404), { label: "CV" })).rejects.toThrow(
      NotFoundError,
    );
  });

  test("a removed Deadline or Requirement can't be edited", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addProgramme(ana.id, erasmus);
    const final = await core.addDeadline(ana.id, programmeEntry(id), {
      label: "Final",
      date: "2027-01-15",
    });
    const cv = await core.addRequirement(ana.id, programmeEntry(id), { label: "CV" });
    await core.removeDeadline(ana.id, final);
    await core.removeRequirement(ana.id, cv);

    await expect(
      core.editDeadline(ana.id, final, { label: "Final", date: "2027-02-01" }),
    ).rejects.toThrow(NotFoundError);
    await expect(core.editRequirement(ana.id, cv, { label: "CV" })).rejects.toThrow(NotFoundError);
  });
});
