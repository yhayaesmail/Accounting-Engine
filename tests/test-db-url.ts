import dotenv from "dotenv";

dotenv.config();

/**
 * DATABASE_URL the test suite runs against.
 *
 * TEST_DATABASE_URL wins if explicitly set. Otherwise the developer's database
 * name gets a `_test` suffix (e.g. `postgres` -> `postgres_test`), so running
 * the suite never touches the original database. tests/global-setup.ts creates
 * and migrates this database automatically.
 */
export function testDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  if (explicit) return explicit;

  const original = process.env.DATABASE_URL;
  if (!original) {
    throw new Error("DATABASE_URL is not set (add it to .env)");
  }
  const url = new URL(original);
  if (url.pathname === "/" || !url.pathname.slice(1)) {
    url.pathname = "/accounting_engine_test";
  } else {
    url.pathname = `${url.pathname}_test`;
  }
  return url.toString();
}
