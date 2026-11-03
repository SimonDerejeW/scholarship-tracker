import { describe, expect } from "vitest";
import { createCore } from "@/core";
import { test } from "@/core/testing/harness";

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
});
