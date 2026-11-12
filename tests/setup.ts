/**
 * Vitest setup file — runs in every worker BEFORE any test file is imported.
 *
 * Redirects the backend stack to isolated test resources so the suite can
 * delete freely without touching the developer's real data:
 *
 * 1. DATABASE_URL -> a dedicated `<name>_test` database (see tests/global-setup.ts
 *    for creation + schema sync). config/prisma.ts calls dotenv.config() but
 *    dotenv never overrides variables that are already set, so this wins.
 * 2. REDIS_URL -> removed, which makes config/redis.ts fall back to its
 *    built-in MemoryRedis (in-process fake). redis.flushall() in tests then
 *    only clears that fake and can never wipe shared or cloud Redis state.
 */
import { testDatabaseUrl } from "./test-db-url.js";

process.env.DATABASE_URL = testDatabaseUrl();
delete process.env.REDIS_URL;
