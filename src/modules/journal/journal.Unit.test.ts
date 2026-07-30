/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  deleteJournalEntry,
  postJournalEntry,
} from "./journal.service.js";
import prisma from "../../config/prisma.js";

vi.mock("../../config/prisma", () => ({
  default: {
    $transaction: vi.fn(),
    journalEntry: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    account: {
      findMany: vi.fn(),
    },
  },
}));

describe("journal service", () => {
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

  describe("createJournalEntry", () => {
    it("should create journal entry successfully", async () => {
      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          account: {
            findMany: vi.fn().mockResolvedValue([
              { id: "acc-1", deletedAt: null },
              { id: "acc-2", deletedAt: null },
            ]),
          },
          journalEntry: {
            create: vi.fn().mockResolvedValue({ id: "entry-1", status: "DRAFT", transactions: [] }),
          },
        });
      });
      const result = await createJournalEntry(validData);
      expect(result).toBeDefined();
      expect(result.id).toBe("entry-1");
      expect(prisma.$transaction).toHaveBeenCalled();
    });
    it("should throw if less than 2 transactions", async () => {
      await expect(
        createJournalEntry({
          ...validData,
          transactions: [{ accountId: "acc-1", debit: 100 }],
        })
      ).rejects.toThrow("At least 2 transactions are required");
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
      ).rejects.toThrow("Total debit must equal total credit");
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
      ).rejects.toThrow("Each transaction must have either debit OR credit");
    });
    it("should throw on invalid or unauthorized account", async () => {
      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          account: {
            findMany: vi.fn().mockResolvedValue([{ id: "acc-1", deletedAt: null }]),
          },
          journalEntry: {
            create: vi.fn(),
          },
        });
      });
      await expect(
        createJournalEntry(validData)
      ).rejects.toThrow("Invalid or unauthorized account");
    });
  });

  describe("getAllJournalEntries", () => {
    it("should return paginated entries", async () => {
      (prisma.journalEntry.count as any).mockResolvedValue(1);
      (prisma.journalEntry.findMany as any).mockResolvedValue([{ id: "1", transactions: [] }]);

      const result = await getAllJournalEntries("company-1", 1, 10);

      expect(result.data).toBeDefined();
      expect(result.pagination.totalEntries).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
      expect(prisma.journalEntry.count).toHaveBeenCalledWith({
        where: { companyId: "company-1", deletedAt: null },
      });
    });
    it("should return empty array if no entries", async () => {
      (prisma.journalEntry.count as any).mockResolvedValue(0);
      (prisma.journalEntry.findMany as any).mockResolvedValue([]);
      const result = await getAllJournalEntries("company-1", 1, 10);
      expect(result.data).toEqual([]);
      expect(result.pagination.totalEntries).toBe(0);
    });
  });

  describe("getJournalEntryById", () => {
    it("should return entry", async () => {
      (prisma.journalEntry.findFirst as any).mockResolvedValue({
        id: "1",
        companyId: "company-1",
        deletedAt: null,
      });
      const result = await getJournalEntryById("1", "company-1");
      expect(result).toBeDefined();
      expect(result.id).toBe("1");
    });
    it("should throw if not found", async () => {
      (prisma.journalEntry.findFirst as any).mockResolvedValue(null);
      await expect(
        getJournalEntryById("1", "company-1")
      ).rejects.toThrow("Journal entry not found");
    });
  });

  describe("deleteJournalEntry", () => {
    it("should soft delete entry", async () => {
      (prisma.journalEntry.findFirst as any).mockResolvedValue({ id: "1", deletedAt: null });
      (prisma.journalEntry.update as any).mockResolvedValue({ id: "1", deletedAt: new Date() });
      const result = await deleteJournalEntry("1", "company-1");
      expect(result).toBeDefined();
      expect(prisma.journalEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "1" },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });
    it("should throw if not found", async () => {
      (prisma.journalEntry.findFirst as any).mockResolvedValue(null);
      await expect(
        deleteJournalEntry("1", "company-1")
      ).rejects.toThrow("Journal entry not found");
    });
  });

  describe("postJournalEntry", () => {
    it("should post entry", async () => {
      (prisma.journalEntry.findFirst as any).mockResolvedValue({
        id: "1",
        status: "DRAFT",
        transactions: [
          { debit: 100, credit: 0 },
          { debit: 0, credit: 100 },
        ],
      });

      (prisma.journalEntry.update as any).mockResolvedValue({
        id: "1",
        status: "POSTED",
      });

      const result = await postJournalEntry("1", "company-1");

      expect(result.status).toBe("POSTED");
    });

    it("should throw if already posted", async () => {
      (prisma.journalEntry.findFirst as any).mockResolvedValue({
        id: "1",
        status: "POSTED",
        transactions: [],
      });

      await expect(
        postJournalEntry("1", "company-1")
      ).rejects.toThrow("Journal entry already posted");
    });

    it("should throw if debit not equal credit", async () => {
      (prisma.journalEntry.findFirst as any).mockResolvedValue({
        id: "1",
        status: "DRAFT",
        transactions: [
          { debit: 100, credit: 0 },
          { debit: 0, credit: 50 },
        ],
      });

      await expect(
        postJournalEntry("1", "company-1")
      ).rejects.toThrow("Debit and credit must be equal");
    });
  });
});
