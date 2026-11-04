import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts"],
    // The first test in each file boots and migrates PGlite (src/core/testing/harness.ts),
    // which takes well over the 5s default on a 2-core CI runner.
    testTimeout: 30_000,
  },
});
