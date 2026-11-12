/**
 * Prints row counts of the database that .env's DATABASE_URL points to.
 * Run `node tests/count-db.mjs` to snapshot the original data at any time —
 * e.g. before and after `npm test` to prove tests never touch it.
 */
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(`
  SELECT
    (SELECT count(*) FROM "Company")      AS companies,
    (SELECT count(*) FROM "User")         AS users,
    (SELECT count(*) FROM "Account")      AS accounts,
    (SELECT count(*) FROM "Customer")     AS customers,
    (SELECT count(*) FROM "Vendor")       AS vendors,
    (SELECT count(*) FROM "Invoice")      AS invoices,
    (SELECT count(*) FROM "Payment")      AS payments,
    (SELECT count(*) FROM "JournalEntry") AS journal
`);

console.log(JSON.stringify(rows[0]));
await client.end();
