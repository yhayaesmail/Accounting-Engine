/**
 * Vitest global setup — runs once in the main process before the workers.
 *
 * Makes sure the isolated test database exists and matches the Prisma schema:
 *  1. Probes the test database; on "database does not exist" it creates it on
 *     the same server using the same credentials (connecting to the server's
 *     default `postgres` database).
 *  2. Runs `prisma db push` against the test URL so its schema is in sync.
 *
 * The original database from .env is never touched. JWT/refresh secrets and
 * every other variable are left as-is; Redis is isolated per-worker in
 * tests/setup.ts (MemoryRedis fallback).
 */
import { execSync } from "node:child_process";
import { Client } from "pg";
import { testDatabaseUrl } from "./test-db-url.js";

function isMissingDatabaseError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : "";
  return code === "3D000" || /database .* does not exist/i.test(message);
}

async function ensureDatabaseExists(testUrl: string): Promise<void> {
  const probe = new Client({ connectionString: testUrl });
  try {
    await probe.connect();
    await probe.end();
    return; // exists already
  } catch (error) {
    await probe.end().catch(() => undefined);
    if (!isMissingDatabaseError(error)) throw error;
  }

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE "${dbName(testUrl)}"`);
    console.log(`[tests] Created test database "${dbName(testUrl)}".`);
  } finally {
    await admin.end().catch(() => undefined);
  }
}

function dbName(urlString: string): string {
  const url = new URL(urlString);
  return decodeURIComponent(url.pathname.replace(/^\//, ""));
}

async function main() {
  const testUrl = testDatabaseUrl();
  console.log(`[tests] Using isolated test database "${dbName(testUrl)}".`);

  await ensureDatabaseExists(testUrl);

  execSync("npx prisma db push --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });
}

export default main;
