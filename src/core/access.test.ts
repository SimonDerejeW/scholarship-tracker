import { eq } from "drizzle-orm";
import { describe, expect } from "vitest";
import { createCore, InvalidInputError, NotAllowedError, NotFoundError, type Db } from "@/core";
import * as schema from "@/core/schema";
import { addMember, programmeEntry, scholarshipEntry, test } from "@/core/testing/harness";

/** The Admin, signed up: Better Auth creates Member records in the app, so tests insert them. */
async function signUpAdmin(db: Db) {
  const admin = { id: "admin", name: "Admin", email: "admin@example.com" };
  await db.insert(schema.member).values(admin);
  return admin;
}

/** A signed-in browser for this Member. Better Auth keeps sessions; core only ends them. */
async function signIn(db: Db, memberId: string) {
  const token = `token-${memberId}-${Math.random()}`;
  await db.insert(schema.session).values({
    id: token,
    token,
    userId: memberId,
    expiresAt: new Date("2099-01-01"),
  });
}

async function sessionsOf(db: Db, memberId: string) {
  return db.select().from(schema.session).where(eq(schema.session.userId, memberId));
}

function setup(db: Db) {
  return createCore({ db, adminEmail: "admin@example.com" });
}

describe("canSignIn", () => {
  test("admits the Admin email", async ({ db }) => {
    const core = createCore({ db, adminEmail: "admin@example.com" });

    expect(await core.canSignIn("admin@example.com")).toBe(true);
  });

  test("rejects any other email", async ({ db }) => {
    const core = createCore({ db, adminEmail: "admin@example.com" });

    expect(await core.canSignIn("stranger@example.com")).toBe(false);
    expect(await core.canSignIn("")).toBe(false);
  });

  test("matches the Admin email regardless of case", async ({ db }) => {
    const core = createCore({ db, adminEmail: "Admin@Example.com" });

    expect(await core.canSignIn("admin@example.com")).toBe(true);
    expect(await core.canSignIn("ADMIN@EXAMPLE.COM")).toBe(true);
  });

  test("admits an email the Admin added to the Allowlist, regardless of case", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);

    await core.addToAllowlist(admin.id, "Ana@Example.com");

    expect(await core.canSignIn("ana@example.com")).toBe(true);
    expect(await core.canSignIn(" ANA@EXAMPLE.COM ")).toBe(true);
    expect(await core.canSignIn("bo@example.com")).toBe(false);
  });
});

describe("the Allowlist", () => {
  test("lists the emails the Admin added alphabetically, and adding one twice keeps one entry", async ({
    db,
  }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);

    await core.addToAllowlist(admin.id, "bo@example.com");
    await core.addToAllowlist(admin.id, "Ana@example.com");
    await core.addToAllowlist(admin.id, " ana@EXAMPLE.com");

    expect(await core.listAllowlist(admin.id)).toEqual(["ana@example.com", "bo@example.com"]);
  });

  test("refuses anything that isn't an email address", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);

    for (const email of ["", "   ", "ana", "ana@", "@example.com", "ana @example.com"]) {
      await expect(core.addToAllowlist(admin.id, email)).rejects.toThrow(
        new InvalidInputError("Enter an email address, like name@example.com."),
      );
    }
    expect(await core.listAllowlist(admin.id)).toEqual([]);
  });

  test("only the Admin may see or change it", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const ana = await addMember(db, { name: "Ana" });
    await core.addToAllowlist(admin.id, ana.email);
    const refused = new NotAllowedError("Only the Admin can do this.");

    await expect(core.listAllowlist(ana.id)).rejects.toThrow(refused);
    await expect(core.addToAllowlist(ana.id, "bo@example.com")).rejects.toThrow(refused);
    await expect(core.removeFromAllowlist(ana.id, ana.email)).rejects.toThrow(refused);
    await expect(core.addToAllowlist("nobody", "bo@example.com")).rejects.toThrow(refused);
    expect(await core.canSignIn("bo@example.com")).toBe(false);
    expect(await core.canSignIn(ana.email)).toBe(true);
  });

  test("an email removed from it can no longer sign in", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    await core.addToAllowlist(admin.id, "ana@example.com");
    await core.addToAllowlist(admin.id, "bo@example.com");

    await core.removeFromAllowlist(admin.id, "ANA@example.com");

    expect(await core.canSignIn("ana@example.com")).toBe(false);
    expect(await core.listAllowlist(admin.id)).toEqual(["bo@example.com"]);
  });

  test("removing a Member's email signs them out everywhere, but leaves the Admin signed in", async ({
    db,
  }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    await core.addToAllowlist(admin.id, ana.email);
    await core.addToAllowlist(admin.id, bo.email);
    await core.addToAllowlist(admin.id, admin.email);
    await signIn(db, ana.id);
    await signIn(db, ana.id);
    await signIn(db, bo.id);
    await signIn(db, admin.id);

    await core.removeFromAllowlist(admin.id, ana.email.toUpperCase());
    await core.removeFromAllowlist(admin.id, admin.email);

    expect(await sessionsOf(db, ana.id)).toHaveLength(0);
    expect(await sessionsOf(db, bo.id)).toHaveLength(1);
    expect(await sessionsOf(db, admin.id)).toHaveLength(1);
    expect(await core.canSignIn(admin.email)).toBe(true);
  });

  test("removing an email that isn't on it changes nothing", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    await core.addToAllowlist(admin.id, "bo@example.com");

    await core.removeFromAllowlist(admin.id, "ana@example.com");

    expect(await core.listAllowlist(admin.id)).toEqual(["bo@example.com"]);
  });
});

describe("Members", () => {
  test("the Admin sees every Member, alphabetically, with whether they can still sign in", async ({
    db,
  }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const bo = await addMember(db, { name: "Bo" });
    const ana = await addMember(db, { name: "Ana" });
    await core.addToAllowlist(admin.id, ana.email);

    expect(await core.listMembers(admin.id)).toEqual([
      { id: admin.id, name: "Admin", email: admin.email, isAdmin: true, canSignIn: true },
      { id: ana.id, name: "Ana", email: ana.email, isAdmin: false, canSignIn: true },
      { id: bo.id, name: "Bo", email: bo.email, isAdmin: false, canSignIn: false },
    ]);
  });

  test("only the Admin may see or remove Members", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    await core.addToAllowlist(admin.id, bo.email);
    const refused = new NotAllowedError("Only the Admin can do this.");

    await expect(core.listMembers(ana.id)).rejects.toThrow(refused);
    await expect(core.removeMember(ana.id, bo.id)).rejects.toThrow(refused);
    expect(await core.canSignIn(bo.email)).toBe(true);
    expect((await core.listMembers(admin.id)).map((m) => m.name)).toEqual(["Admin", "Ana", "Bo"]);
  });

  test("the Admin can't remove themselves", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);

    await expect(core.removeMember(admin.id, admin.id)).rejects.toThrow(
      new NotAllowedError("The Admin can't be removed."),
    );
  });

  test("removing someone who isn't a Member is refused", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const ana = await addMember(db, { name: "Ana" });
    await core.removeMember(admin.id, ana.id);

    for (const id of [ana.id, "nobody"]) {
      await expect(core.removeMember(admin.id, id)).rejects.toThrow(
        new NotFoundError("That Member no longer exists."),
      );
    }
  });
});

describe("removing a Member", () => {
  const robotics = { name: "MSc Robotics", university: "TU Delft", fundingIncluded: false };
  const daad = { name: "DAAD Study Scholarship", provider: "DAAD" };

  test("deletes their Applications, ticks and Personal items, and nobody else's", async ({
    db,
  }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const programmeId = await core.addProgramme(bo.id, robotics);
    const scholarshipId = await core.addScholarship(bo.id, daad);
    const cv = await core.addRequirement(bo.id, programmeEntry(programmeId), { label: "CV" });
    const anasProgramme = await core.startApplication(ana.id, programmeEntry(programmeId));
    const anasScholarship = await core.startApplication(ana.id, scholarshipEntry(scholarshipId));
    await core.linkApplication(ana.id, anasScholarship, anasProgramme);
    await core.tickRequirement(ana.id, anasProgramme, cv, true);
    await core.addPersonalItem(ana.id, anasProgramme, "Ask Prof. X for a reference");
    const bosProgramme = await core.startApplication(bo.id, programmeEntry(programmeId));
    await core.tickRequirement(bo.id, bosProgramme, cv, true);
    await core.addPersonalItem(bo.id, bosProgramme, "Book IELTS");

    await core.removeMember(admin.id, ana.id);

    expect(await core.getApplication(ana.id, anasProgramme)).toBeNull();
    expect(await core.getApplication(ana.id, anasScholarship)).toBeNull();
    expect(await core.upcoming(ana.id, "2027-01-01", "all")).toEqual([]);
    expect(await core.getChecklist(bo.id, bosProgramme)).toMatchObject({
      requirements: [{ id: cv, ticked: true }],
      personalItems: [{ label: "Book IELTS", ticked: false }],
    });
    // Nothing of theirs holds the Scholarship in place any more.
    await core.deleteCatalogEntry(bo.id, scholarshipEntry(scholarshipId));
    // Back in the circle, the same Programme starts from an empty Checklist.
    await core.addToAllowlist(admin.id, ana.email);
    const again = await core.startApplication(ana.id, programmeEntry(programmeId));
    expect(await core.getChecklist(ana.id, again)).toMatchObject({
      requirements: [{ id: cv, ticked: false }],
      personalItems: [],
    });
  });

  test("keeps the Catalog entries they added, still naming them as the adder", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    const scholarshipId = await core.addScholarship(ana.id, daad);

    await core.removeMember(admin.id, ana.id);

    expect((await core.getProgramme(bo.id, programmeId))?.addedBy).toEqual({
      id: ana.id,
      name: "Ana",
    });
    expect((await core.getScholarship(bo.id, scholarshipId))?.addedBy).toEqual({
      id: ana.id,
      name: "Ana",
    });
    expect((await core.searchCatalog(bo.id, "", "2027-01-01")).programmes).toHaveLength(1);
  });

  test("takes them off the Allowlist and the Member list, and signs them out", async ({ db }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const ana = await addMember(db, { name: "Ana" });
    const bo = await addMember(db, { name: "Bo" });
    await core.addToAllowlist(admin.id, ana.email.toUpperCase());
    await core.addToAllowlist(admin.id, bo.email);
    await signIn(db, ana.id);
    await signIn(db, bo.id);

    await core.removeMember(admin.id, ana.id);

    expect(await core.canSignIn(ana.email)).toBe(false);
    expect(await core.listAllowlist(admin.id)).toEqual([bo.email]);
    expect((await core.listMembers(admin.id)).map((m) => m.name)).toEqual(["Admin", "Bo"]);
    expect(await sessionsOf(db, ana.id)).toHaveLength(0);
    expect(await sessionsOf(db, bo.id)).toHaveLength(1);
  });

  test("putting their email back on the Allowlist makes them a Member again, starting afresh", async ({
    db,
  }) => {
    const core = setup(db);
    const admin = await signUpAdmin(db);
    const ana = await addMember(db, { name: "Ana" });
    const programmeId = await core.addProgramme(ana.id, robotics);
    await core.startApplication(ana.id, programmeEntry(programmeId));
    await core.removeMember(admin.id, ana.id);

    await core.addToAllowlist(admin.id, ana.email);

    expect(await core.canSignIn(ana.email)).toBe(true);
    expect((await core.listMembers(admin.id)).map((m) => m.name)).toEqual(["Admin", "Ana"]);
    expect(await core.applicationTo(ana.id, programmeEntry(programmeId))).toBeNull();
  });
});
