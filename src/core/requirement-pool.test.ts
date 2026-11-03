import { describe, expect } from "vitest";
import { createCore, NotFoundError, type Db } from "@/core";
import { addMember, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

const programme = {
  name: "MSc Robotics",
  university: "TU Delft",
  fundingIncluded: false,
};

describe("the Requirement pool", () => {
  test("starts with common Requirements when the Catalog has none", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const id = await core.addProgramme(ana.id, programme);

    expect(await core.suggestRequirements(ana.id, id)).toEqual([
      { label: "CV", note: null },
      { label: "Motivation letter", note: null },
      { label: "Reference letters", note: null },
      { label: "Transcript of records", note: null },
      { label: "Degree certificate", note: null },
      { label: "English language test", note: null },
      { label: "Passport copy", note: null },
      { label: "Application fee", note: null },
    ]);
  });

  test("puts Requirements from the Catalog first, most used first, ignoring case", async ({
    db,
  }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const delft = await core.addProgramme(ana.id, programme);
    const eth = await core.addProgramme(bo.id, { ...programme, university: "ETH Zürich" });
    const kth = await core.addProgramme(bo.id, { ...programme, university: "KTH" });
    await core.addRequirement(ana.id, delft, { label: "Portfolio" });
    await core.addRequirement(bo.id, eth, { label: "portfolio " });
    await core.addRequirement(bo.id, eth, { label: "CV" });
    const fresh = await core.addProgramme(ana.id, { ...programme, university: "EPFL" });
    await core.addRequirement(bo.id, kth, { label: "GRE" });

    const labels = (await core.suggestRequirements(ana.id, fresh)).map(({ label }) => label);

    expect(labels.slice(0, 3)).toEqual(["Portfolio", "CV", "GRE"]);
    expect(labels.slice(3)).toEqual([
      "Motivation letter",
      "Reference letters",
      "Transcript of records",
      "Degree certificate",
      "English language test",
      "Passport copy",
      "Application fee",
    ]);
  });

  test("spells a Requirement the way most Programmes do", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    for (const [i, label] of ["ielts", "IELTS", "IELTS"].entries()) {
      const id = await core.addProgramme(ana.id, { ...programme, university: `Uni ${i}` });
      await core.addRequirement(ana.id, id, { label });
    }
    const fresh = await core.addProgramme(ana.id, { ...programme, university: "EPFL" });

    const [first] = await core.suggestRequirements(ana.id, fresh);

    expect(first.label).toBe("IELTS");
  });

  test("leaves out Requirements the Programme already has", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const other = await core.addProgramme(ana.id, programme);
    await core.addRequirement(ana.id, other, { label: "Portfolio" });
    const id = await core.addProgramme(ana.id, { ...programme, university: "KTH" });
    await core.addRequirement(ana.id, id, { label: "portfolio" });
    await core.addRequirement(ana.id, id, { label: "cv" });

    const labels = (await core.suggestRequirements(ana.id, id)).map(({ label }) => label);

    expect(labels).not.toContain("Portfolio");
    expect(labels).not.toContain("CV");
    expect(labels).toContain("Motivation letter");
  });

  test("carries the note most often given with a Requirement, to adjust", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });
    const notes = ["≥ 7.0", "≥ 6.5", null, "≥ 6.5"];
    for (const [i, note] of notes.entries()) {
      const id = await core.addProgramme(ana.id, { ...programme, university: `Uni ${i}` });
      await core.addRequirement(ana.id, id, { label: "IELTS", note });
      await core.addRequirement(ana.id, id, { label: "Portfolio" });
    }
    const fresh = await core.addProgramme(ana.id, { ...programme, university: "EPFL" });

    const suggestions = await core.suggestRequirements(ana.id, fresh);

    expect(suggestions.slice(0, 2)).toEqual([
      { label: "IELTS", note: "≥ 6.5" },
      { label: "Portfolio", note: null },
    ]);
  });

  test("can't be asked for a Programme that doesn't exist", async ({ db }) => {
    const core = setup(db);
    const ana = await addMember(db, { name: "Ana" });

    await expect(core.suggestRequirements(ana.id, 404)).rejects.toThrow(NotFoundError);
  });
});
