// import { PrismaClient } from "../../prisma/generated/prisma/client/index.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// Models that support soft deletion via the `deletedAt` column.
// The `Transaction` model does NOT have soft-delete and is intentionally excluded.
const SOFT_DELETE_MODELS = new Set([
  "Company",
  "User",
  "Account",
  "JournalEntry",
  "Customer",
  "Vendor",
  "Invoice",
  "Payment",
]);

// Read-only actions where soft-deleted records must be hidden automatically.
const SOFT_DELETE_ACTIONS = new Set([
  "findFirst",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

/**
 * Prisma middleware that automatically adds `deletedAt: null` to every read
 * query on soft-delete-enabled models. This keeps service code clean and
 * prevents deleted records from leaking into responses.
 *
 * All service files already filter `deletedAt: null` manually, so this is a
 * defensive backstop. It is wrapped in a feature check because `$use` may not
 * be available in every Prisma/adapter configuration.
 */
type MiddlewareParams = {
  action: string;
  model?: string;
  args?: unknown;
};

// Prisma 7 driver adapters do not expose `$use`, so access the hook through a
// structural cast; it only registers when the runtime client supports it.
const clientWithMiddleware = prisma as unknown as {
  $use?: (
    callback: (
      params: MiddlewareParams,
      next: (params: MiddlewareParams) => Promise<unknown>
    ) => void
  ) => void;
};

if (typeof clientWithMiddleware.$use === "function") {
  clientWithMiddleware.$use(async (params, next) => {
    if (
      SOFT_DELETE_ACTIONS.has(params.action) &&
      SOFT_DELETE_MODELS.has(params.model ?? "") &&
      params.args &&
      typeof params.args === "object" &&
      "where" in params.args &&
      params.args.where &&
      typeof params.args.where === "object" &&
      !("deletedAt" in params.args.where)
    ) {
      params.args = {
        ...params.args,
        where: {
          ...params.args.where,
          deletedAt: null,
        },
      };
    }
    return next(params);
  });
}

export default prisma;