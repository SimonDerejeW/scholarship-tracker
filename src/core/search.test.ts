import { describe, expect } from "vitest";
import { createCore, type Db } from "@/core";
import { addMember, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

const today = "2027-01-01";

async function catalog(db: Db) {
  const core = setup(db);
  const ana = await addMember(db, { name: "Ana" });
  const programme = (name: string, university: string) =>
    core.addProgramme(ana.id, { name, university, fundingIncluded: false });
  const scholarship = (name: string, provider: string) =>
    core.addScholarship(ana.id, { name, provider });
  await programme("MSc Data Science", "University of Lisbon");
  await programme("MSc Robotics", "TU Delft");
  await programme("MSc Artificial Intelligence", "KU Leuven");
  await scholarship("DAAD Study Scholarship", "DAAD");
  await scholarship("Chevening Scholarship", "UK Foreign Office");
  return { core, ana };
}

/** The names of what a search finds, by kind. */
async function names(
  core: ReturnType<typeof setup>,
  memberId: string,
  query: string,
): Promise<{ programmes: string[]; scholarships: string[] }> {
  const { programmes, scholarships } = await core.searchCatalog(memberId, query, today);
  return {
    programmes: programmes.map(({ name }) => name),
    scholarships: scholarships.map(({ name }) => name),
  };
}

describe("searching the Catalog", () => {
  test("an empty search lists every Programme and Scholarship", async ({ db }) => {
    const { core, ana } = await catalog(db);

    expect(await names(core, ana.id, "  ")).toEqual({
      programmes: ["MSc Artificial Intelligence", "MSc Data Science", "MSc Robotics"],
      scholarships: ["Chevening Scholarship", "DAAD Study Scholarship"],
    });
  });

  test("finds entries by part of their name, whatever the case", async ({ db }) => {
    const { core, ana } = await catalog(db);

    expect(await names(core, ana.id, "robot")).toEqual({
      programmes: ["MSc Robotics"],
      scholarships: [],
    });
    expect(await names(core, ana.id, "SCHOLAR")).toEqual({
      programmes: [],
      scholarships: ["Chevening Scholarship", "DAAD Study Scholarship"],
    });
  });

  test("finds Programmes by university and Scholarships by provider", async ({ db }) => {
    const { core, ana } = await catalog(db);

    expect(await names(core, ana.id, "delft")).toEqual({
      programmes: ["MSc Robotics"],
      scholarships: [],
    });
    expect(await names(core, ana.id, "foreign")).toEqual({
      programmes: [],
      scholarships: ["Chevening Scholarship"],
    });
  });

  test("with several words, finds entries matching every one, in any field", async ({ db }) => {
    const { core, ana } = await catalog(db);

    expect(await names(core, ana.id, "msc lisbon")).toEqual({
      programmes: ["MSc Data Science"],
      scholarships: [],
    });
    expect(await names(core, ana.id, "msc oxford")).toEqual({ programmes: [], scholarships: [] });
  });

  test("treats % and _ as ordinary characters", async ({ db }) => {
    const { core, ana } = await catalog(db);
    await core.addProgramme(ana.id, {
      name: "MSc 100% Online",
      university: "Open_University",
      fundingIncluded: false,
    });

    expect(await names(core, ana.id, "%")).toEqual({
      programmes: ["MSc 100% Online"],
      scholarships: [],
    });
    expect(await names(core, ana.id, "_")).toEqual({
      programmes: ["MSc 100% Online"],
      scholarships: [],
    });
  });

  test("lists what it finds soonest Deadline first, with each entry's next Deadline", async ({
    db,
  }) => {
    const { core, ana } = await catalog(db);
    const { programmes } = await core.searchCatalog(ana.id, "", today);
    const robotics = programmes.find(({ name }) => name === "MSc Robotics")!;
    await core.addDeadline(ana.id, { kind: "programme", id: robotics.id }, {
      label: "Final",
      date: "2027-02-01",
    });

    const found = await core.searchCatalog(ana.id, "msc", today);

    expect(
      found.programmes.map(({ name, nextDeadline }) => ({ name, nextDeadline })),
    ).toEqual([
      { name: "MSc Robotics", nextDeadline: { label: "Final", date: "2027-02-01" } },
      { name: "MSc Artificial Intelligence", nextDeadline: null },
      { name: "MSc Data Science", nextDeadline: null },
    ]);
  });
});
