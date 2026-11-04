import { describe, expect } from "vitest";
import { createCore, toStageFilter, type Db } from "@/core";
import { addMember, programmeEntry, scholarshipEntry, test } from "@/core/testing/harness";

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

/** A Member with a Programme of their own to apply to, with these Deadlines. */
async function withProgramme(db: Db, deadlines: { label: string; date: string }[]) {
  const core = setup(db);
  const ana = await addMember(db, { name: "Ana" });
  const programmeId = await core.addProgramme(ana.id, {
    name: "MSc Robotics",
    university: "TU Delft",
    fundingIncluded: false,
  });
  for (const deadline of deadlines) {
    await core.addDeadline(ana.id, programmeEntry(programmeId), deadline);
  }
  return { core, ana, entry: programmeEntry(programmeId) };
}

describe("an Application's next Deadline", () => {
  test("is the earliest Deadline on or after today, with the days left until it", async ({
    db,
  }) => {
    const { core, ana, entry } = await withProgramme(db, [
      { label: "Final", date: "2027-01-15" },
      { label: "Early", date: "2026-11-10" },
      { label: "Info day", date: "2026-10-01" },
    ]);
    const id = await core.startApplication(ana.id, entry);

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toEqual([
      {
        id,
        stage: "Interested",
        entry: { kind: "programme", id: entry.id, name: "MSc Robotics", detail: "TU Delft" },
        nextDeadline: { label: "Early", date: "2026-11-10", daysLeft: 7 },
        lastDeadline: null,
        missed: false,
        highlight: true,
        progress: { done: 0, total: 0 },
        fundsApplicationId: null,
      },
    ]);
  });
});

describe("on a Deadline's day", () => {
  test("it is still the next Deadline, with 0 days left", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, [
      { label: "Early", date: "2026-11-02" },
      { label: "Final", date: "2026-11-03" },
    ]);
    await core.startApplication(ana.id, entry);

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      { nextDeadline: { label: "Final", date: "2026-11-03", daysLeft: 0 }, missed: false },
    ]);
  });

  test("the next day it has passed", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, [
      { label: "Final", date: "2026-11-03" },
      { label: "Late round", date: "2027-02-01" },
    ]);
    await core.startApplication(ana.id, entry);

    expect(await core.upcoming(ana.id, "2026-11-04", "open")).toMatchObject([
      { nextDeadline: { label: "Late round", date: "2027-02-01", daysLeft: 89 } },
    ]);
  });
});

describe("the 30-day highlight", () => {
  test("lights an Interested Application whose next Deadline is 30 days away", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, [{ label: "Final", date: "2026-12-03" }]);
    await core.startApplication(ana.id, entry);

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      { nextDeadline: { daysLeft: 30 }, highlight: true },
    ]);
  });

  test("not at 31 days away", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, [{ label: "Final", date: "2026-12-03" }]);
    await core.startApplication(ana.id, entry);

    expect(await core.upcoming(ana.id, "2026-11-02", "open")).toMatchObject([
      { nextDeadline: { daysLeft: 31 }, highlight: false },
    ]);
  });

  test("only for Interested: a Preparing Application due tomorrow isn't lit", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, [{ label: "Final", date: "2026-11-04" }]);
    const id = await core.startApplication(ana.id, entry);
    await core.setStage(ana.id, id, "Preparing");

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      { stage: "Preparing", nextDeadline: { daysLeft: 1 }, highlight: false },
    ]);
  });
});

describe("Missed", () => {
  const passed = [
    { label: "Early", date: "2026-09-01" },
    { label: "Final", date: "2026-10-28" },
  ];

  test("flags an Interested Application once every Deadline has passed", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, passed);
    await core.startApplication(ana.id, entry);

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      {
        stage: "Interested",
        nextDeadline: null,
        lastDeadline: { label: "Final", date: "2026-10-28" },
        missed: true,
        highlight: false,
      },
    ]);
  });

  test("flags a Preparing one too, and leaves its Stage alone", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, passed);
    const id = await core.startApplication(ana.id, entry);
    await core.setStage(ana.id, id, "Preparing");

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      { stage: "Preparing", missed: true },
    ]);
    expect(await core.getApplication(ana.id, id)).toMatchObject({ stage: "Preparing" });
  });

  test.for(["Submitted", "Interview"])(
    "doesn't flag an Application at %s once its Deadlines have passed",
    async (stage, { db }) => {
      const { core, ana, entry } = await withProgramme(db, passed);
      const id = await core.startApplication(ana.id, entry);
      await core.setStage(ana.id, id, stage);

      expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
        { stage, nextDeadline: null, lastDeadline: { date: "2026-10-28" }, missed: false },
      ]);
    },
  );

  test("not while a Deadline is still to come", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, [
      ...passed,
      { label: "Late round", date: "2026-11-03" },
    ]);
    await core.startApplication(ana.id, entry);

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      { missed: false, lastDeadline: null },
    ]);
  });
});

describe("Deadline TBA", () => {
  test("an entry with no Deadlines has neither a next nor a last one, and isn't Missed", async ({
    db,
  }) => {
    const { core, ana, entry } = await withProgramme(db, []);
    await core.startApplication(ana.id, entry);

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      { nextDeadline: null, lastDeadline: null, missed: false, highlight: false },
    ]);
  });
});

/** A Member with one Application per entry, each entry a Programme with these Deadline dates. */
async function withApplications(
  db: Db,
  entries: { name: string; dates: string[]; stage?: string }[],
) {
  const core = setup(db);
  const ana = await addMember(db, { name: "Ana" });
  for (const { name, dates, stage } of entries) {
    const entry = programmeEntry(
      await core.addProgramme(ana.id, { name, university: "TU Delft", fundingIncluded: false }),
    );
    for (const date of dates) {
      await core.addDeadline(ana.id, entry, { label: "Final", date });
    }
    const id = await core.startApplication(ana.id, entry);
    if (stage) {
      await core.setStage(ana.id, id, stage);
    }
  }
  return { core, ana };
}

const names = (rows: { entry: { name: string } }[]) => rows.map((row) => row.entry.name);

describe("the order of Upcoming", () => {
  test("by next Deadline, soonest first; then Missed; then passed; then Deadline TBA", async ({
    db,
  }) => {
    const { core, ana } = await withApplications(db, [
      { name: "No dates yet", dates: [] },
      { name: "Missed it", dates: ["2026-10-01"] },
      { name: "January", dates: ["2026-10-01", "2027-01-15"] },
      { name: "Sent, waiting", dates: ["2026-10-20"], stage: "Submitted" },
      { name: "Today", dates: ["2026-11-03"] },
      { name: "December", dates: ["2026-12-01"], stage: "Preparing" },
    ]);

    expect(names(await core.upcoming(ana.id, "2026-11-03", "open"))).toEqual([
      "Today",
      "December",
      "January",
      "Missed it",
      "Sent, waiting",
      "No dates yet",
    ]);
  });
});

describe("the Stage filter", () => {
  const atEveryStage = [
    { name: "Interested one", dates: [], stage: "Interested" },
    { name: "Preparing one", dates: [], stage: "Preparing" },
    { name: "Submitted one", dates: [], stage: "Submitted" },
    { name: "Interview one", dates: [], stage: "Interview" },
    { name: "Accepted one", dates: [], stage: "Accepted" },
    { name: "Rejected one", dates: [], stage: "Rejected" },
    { name: "Withdrawn one", dates: [], stage: "Withdrawn" },
  ];

  test("open Stages by default: Accepted, Rejected and Withdrawn are hidden", async ({ db }) => {
    const { core, ana } = await withApplications(db, atEveryStage);

    expect(names(await core.upcoming(ana.id, "2026-11-03", "open"))).toEqual([
      "Interested one",
      "Interview one",
      "Preparing one",
      "Submitted one",
    ]);
  });

  test("one Stage shows only Applications at it, finished or not", async ({ db }) => {
    const { core, ana } = await withApplications(db, atEveryStage);

    expect(names(await core.upcoming(ana.id, "2026-11-03", "Rejected"))).toEqual(["Rejected one"]);
    expect(names(await core.upcoming(ana.id, "2026-11-03", "Preparing"))).toEqual([
      "Preparing one",
    ]);
  });

  test("all shows every Stage", async ({ db }) => {
    const { core, ana } = await withApplications(db, atEveryStage);

    expect(await core.upcoming(ana.id, "2026-11-03", "all")).toHaveLength(7);
  });

  test("a finished Application whose Deadlines have passed isn't Missed", async ({ db }) => {
    const { core, ana } = await withApplications(db, [
      { name: "Withdrawn one", dates: ["2026-10-01"], stage: "Withdrawn" },
    ]);

    expect(await core.upcoming(ana.id, "2026-11-03", "Withdrawn")).toMatchObject([
      { missed: false, lastDeadline: { date: "2026-10-01" } },
    ]);
  });
});

describe("reading a Stage filter from the address", () => {
  test("keeps a Stage or all, and falls back to the open Stages", () => {
    expect(toStageFilter("Rejected")).toBe("Rejected");
    expect(toStageFilter("all")).toBe("all");
    expect(toStageFilter("rejected")).toBe("open");
    expect(toStageFilter(undefined)).toBe("open");
  });
});

describe("whose Applications", () => {
  test("only the calling Member's appear, even on a shared entry", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, [{ label: "Final", date: "2026-12-01" }]);
    const bo = await addMember(db, { name: "Bo" });
    const scholarshipId = await core.addScholarship(bo.id, { name: "DAAD", provider: "DAAD" });
    await core.startApplication(ana.id, entry);
    await core.startApplication(bo.id, entry);
    await core.startApplication(bo.id, scholarshipEntry(scholarshipId));

    expect(names(await core.upcoming(ana.id, "2026-11-03", "all"))).toEqual(["MSc Robotics"]);
    expect(names(await core.upcoming(bo.id, "2026-11-03", "all"))).toEqual([
      "MSc Robotics",
      "DAAD",
    ]);
    expect(await core.upcoming(ana.id, "2026-11-03", "all")).toMatchObject([
      { nextDeadline: { date: "2026-12-01" } },
    ]);
  });
});

describe("Checklist progress", () => {
  test("counts ticked Requirements and Personal items over the whole Checklist", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, []);
    const cv = await core.addRequirement(ana.id, entry, { label: "CV" });
    await core.addRequirement(ana.id, entry, { label: "Transcript" });
    await core.addRequirement(ana.id, entry, { label: "Two references" });
    const id = await core.startApplication(ana.id, entry);
    await core.tickRequirement(ana.id, id, cv, true);
    const ask = await core.addPersonalItem(ana.id, id, "Ask Prof. X");
    await core.addPersonalItem(ana.id, id, "Book IELTS");
    await core.tickPersonalItem(ana.id, ask, true);

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      { progress: { done: 2, total: 5 } },
    ]);
  });

  test("another Member's ticks on the same entry don't count", async ({ db }) => {
    const { core, ana, entry } = await withProgramme(db, []);
    const bo = await addMember(db, { name: "Bo" });
    const cv = await core.addRequirement(ana.id, entry, { label: "CV" });
    await core.addRequirement(ana.id, entry, { label: "Transcript" });
    await core.startApplication(ana.id, entry);
    const theirs = await core.startApplication(bo.id, entry);
    await core.tickRequirement(bo.id, theirs, cv, true);
    await core.addPersonalItem(bo.id, theirs, "Ask Prof. X");

    expect(await core.upcoming(ana.id, "2026-11-03", "open")).toMatchObject([
      { progress: { done: 0, total: 2 } },
    ]);
  });
});
