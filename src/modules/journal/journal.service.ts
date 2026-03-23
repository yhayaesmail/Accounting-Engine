import { log } from "node:console";
import prisma from "../../config/prisma.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { CreateJournalEntryInput  } from "./journal.validation.js";


// export const createJournalEntry = async (data: CreateJournalEntryInput)=>{
//     const {date, description,transactions,userId,companyId} = data;
//     if(!transactions || transactions.length <2) {
//         throw new ConflictError(`At least 2 transations Required`);
//     }
//     let totalDebit = 0;
//     let totalCridit = 0;
//     for (const t of transactions){
//         totalDebit += t.debit ||0;
//         totalCridit +=t.credit ||0;
//     }
//     if(totalCridit !== totalDebit){
//         throw new ConflictError(`Debit must Equal Cridit`);
//     }
//     const transactionsToCreate = transactions.map(t => ({
//   accountId: t.accountId,
//   debit: t.debit || 0,
//   credit: t.credit || 0,
//   type: t.debit ? "DEBIT" : "CREDIT", 
// }));

//     const entry = await prisma.journalEntry.create({
//         data:{
//             description,
//             date,
//             companyId,
//             userId,
//             transactions:{
//                 create:transactionsToCreate
//             }
//         },
//     })
//     return entry;
// }

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



