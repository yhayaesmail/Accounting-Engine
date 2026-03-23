import { log } from "node:console";
import prisma from "../../config/prisma.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { CreateJournalEntryInput  } from "./journal.validation.js";



export const createJournalEntry = async (data: CreateJournalEntryInput) => {
  const { date, description, transactions, userId, companyId } = data;
  if (!transactions || transactions.length < 2) {
    throw new BadRequestError("At least 2 transactions are required");
  }
  let totalDebit = 0;
  let totalCredit = 0;

  for (const t of transactions) {
    if ((!t.debit && !t.credit) || (t.debit && t.credit)) {
      throw new BadRequestError("Each transaction must have either debit OR credit");
    }
    if (t.debit && t.debit < 0) {
      throw new BadRequestError("Debit cannot be negative");
    }
    if (t.credit && t.credit < 0) {
      throw new BadRequestError("Credit cannot be negative");
    }
    totalDebit += t.debit || 0;
    totalCredit += t.credit || 0;
  }
  if (totalDebit !== totalCredit) {
    logger.warn("Debit and Credit totals do not match", { totalDebit, totalCredit, companyId });
    throw new ConflictError("Total debit must equal total credit");
  }
  try {
    const entry = await prisma.$transaction(async (tx) => {
      const accountIds = transactions.map((t) => t.accountId);
      const accounts = await tx.account.findMany({
        where: {
          id: { in: accountIds },
          companyId,
        },
      });

      if (accounts.length !== accountIds.length) {
        logger.warn("Some accounts not found or unauthorized", { accountIds, companyId });
        throw new BadRequestError("Invalid or unauthorized account");
      }
      const createdEntry = await tx.journalEntry.create({
        data: {
          description,
          date,
          companyId,
          userId,
          status: "DRAFT",
          transactions: {
            create: transactions.map((t) => ({
              accountId: t.accountId,
              debit: t.debit || 0,
              credit: t.credit || 0,
              type: t.debit ? "DEBIT" : "CREDIT",
            })),
          },
        },
        include: {
          transactions: true,
        },
      });
      logger.info("Journal Entry Created", { entryId: createdEntry.id, companyId, userId });
      return createdEntry;
    });

    return entry;
  } catch (error) {
    logger.error("Create Journal Entry Failed", { error });
    throw error;
  }
};


export const getAllJournalEntries = async (
  companyId: string,
  page: number,
  limit: number
) => {
  try {
      if (!companyId) {
    throw new BadRequestError("Company ID is required");
  }
  if (page < 1 || limit < 1) {
    throw new BadRequestError("Page and limit must be positive integers");
  }
  const skip = (page - 1) * limit;
  const totalEntries = await prisma.journalEntry.count({
    where: { companyId },
  });
  if (totalEntries === 0) {
    throw new BadRequestError("No journal entries found for this company");
  }
  const entries = await prisma.journalEntry.findMany({
    where: { companyId ,deletedAt: null},
    include: {
      transactions: true,
    },
    orderBy: {
      date: "desc",
    },
    skip,
    take: limit,
  });

  logger.info("Journal entry fetched", {
  companyId,
  });
  return {
    data: entries,
    pagination: {
      page,
      limit,
      totalEntries,
      totalPages: Math.ceil(totalEntries / limit),
      hasNext: page < Math.ceil(totalEntries / limit),
      hasPrev: page > 1,
    },
  };
  }catch (error) {
  logger.error("Create Journal Entry Failed", {
    error,
    companyId,
  });
  throw error;
  }
};


export const getJournalEntryById = async (id: string, companyId: string) => {
  try {
      if (!id) {
    throw new BadRequestError("Journal entry ID is required");
  }
  if (!companyId) {
    throw new BadRequestError("Company ID is required");
  }
  const entry = await prisma.journalEntry.findUnique({
    where: {
      id,
      companyId,
      deletedAt: null,
    },
    include: {
      transactions: true,
    },
  });
  if (!entry) {
    throw new NotFoundError("Journal entry not found");
  }
  logger.info("Journal entry fetched", {
    entryId: id,
    companyId,
  });

  return entry;
  } catch (error) {
    logger.error("Get Journal Entry Failed", {
      error,
      entryId: id,
      companyId,
    });
    throw error;
  }
};



export const deleteJournalEntry = async (id: string, companyId: string) => {
  try {
    if (!id) {
      throw new BadRequestError("Journal entry ID is required");
    }
    if (!companyId) {
      throw new BadRequestError("Company ID is required");
    }
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
    if (!entry) {
      throw new NotFoundError("Journal entry not found");
    }
    const deletedEntry = await prisma.journalEntry.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    logger.info("Journal entry deleted", {
      entryId: id,
      companyId,
    });
    return deletedEntry;
  } catch (error) {
    logger.error("Delete Journal Entry Failed", {
      error,
      entryId: id,
      companyId,
    });
    throw error;
  }
};



export const postJournalEntry = async (id: string, companyId: string) => {
  try {
    if (!id) {
      throw new BadRequestError("Journal entry ID is required");
    }

    if (!companyId) {
      throw new BadRequestError("Company ID is required");
    }

    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        transactions: true,
      },
    });

    if (!entry) {
      throw new NotFoundError("Journal entry not found");
    }

    if (entry.status === "POSTED") {
      throw new ConflictError("Journal entry already posted");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const t of entry.transactions) {
      totalDebit += t.debit;
      totalCredit += t.credit;
    }

    if (totalDebit !== totalCredit) {
      throw new ConflictError("Debit and credit must be equal");
    }

    const updatedEntry = await prisma.journalEntry.update({
      where: {
        id,
      },
      data: {
        status: "POSTED",
      },
    });

    logger.info("Journal entry posted", {
      entryId: id,
      companyId,
    });

    return updatedEntry;
  } catch (error) {
    logger.error("Post Journal Entry Failed", {
      error,
      entryId: id,
      companyId,
    });
    throw error;
  }
};



