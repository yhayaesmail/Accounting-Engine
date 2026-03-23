/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createJournalEntry } from "./journal.service.js";
import prisma from "../../config/prisma.js";

vi.mock("../../config/prisma", () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

describe("createJournalEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validData = {
    date: new Date(),
    description: "Test Entry",
    userId: "user-1",
    companyId: "company-1",
    transactions: [
      { accountId: "acc-1", debit: 100 },
      { accountId: "acc-2", credit: 100 },
    ],
  };

  it("should create journal entry successfully", async () => {
    (prisma.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: any) => Promise<any>) => {
        return cb({
          account: {
            findMany: vi.fn().mockResolvedValue([
              { id: "acc-1" },
              { id: "acc-2" },
            ]),
          },
          journalEntry: {
            create: vi.fn().mockResolvedValue({ id: "entry-1" }),
          },
        });
      }
    );

    const result = await createJournalEntry(validData);

    expect(result).toBeDefined();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("should throw if less than 2 transactions", async () => {
    await expect(
      createJournalEntry({ ...validData, transactions: [{ accountId: "acc-1", debit: 100 }] })
    ).rejects.toThrow();
  });

  it("should throw if debit not equal credit", async () => {
    await expect(
      createJournalEntry({
        ...validData,
        transactions: [
          { accountId: "acc-1", debit: 100 },
          { accountId: "acc-2", credit: 50 },
        ],
      })
    ).rejects.toThrow();
  });

  it("should throw if transaction has both debit and credit", async () => {
    await expect(
      createJournalEntry({
        ...validData,
        transactions: [
          { accountId: "acc-1", debit: 100, credit: 100 },
          { accountId: "acc-2", credit: 100 },
        ],
      })
    ).rejects.toThrow();
  });
});