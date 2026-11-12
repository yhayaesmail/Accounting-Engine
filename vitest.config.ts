import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Creates/syncs the isolated <name>_test database once before the suite.
    globalSetup: "./tests/global-setup.ts",
    // Per-worker: point Prisma at the test database and drop REDIS_URL so the
    // in-memory Redis fallback is used. Original database/Redis stay untouched.
    setupFiles: ["./tests/setup.ts"],
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
