import { describe, expect } from "vitest";
import { member } from "@/core/schema";
import { test } from "./harness";

// Both tests insert the same Member; the second would hit the unique
// constraints if state leaked from the first.
describe("test harness", () => {
  for (const run of ["first", "second"]) {
    test(`gives the ${run} test a clean database`, async ({ db }) => {
      expect(await db.select().from(member)).toEqual([]);

      await db.insert(member).values({ id: "m1", name: "M", email: "m@example.com" });

      expect(await db.select().from(member)).toHaveLength(1);
    });
  }
});
