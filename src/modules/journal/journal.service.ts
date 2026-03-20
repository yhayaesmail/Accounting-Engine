import prisma from "../../config/prisma.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import { CreateJournalEntryInput  } from "./journal.validation.js";


export const createJournalEntry = async (data: CreateJournalEntryInput)=>{
    const {date, description,transactions,userId,companyId} = data;
    if(!transactions || transactions.length <2) {
        throw new ConflictError(`At least 2 transations Required`);
    }
    let totalDebit = 0;
    let totalCridit = 0;
    for (const t of transactions){
        totalDebit += t.debit ||0;
        totalCridit +=t.credit ||0;
    }
    if(totalCridit !== totalDebit){
        throw new ConflictError(`Debit must Equal Cridit`);
    }
    const transactionsToCreate = transactions.map(t => ({
  accountId: t.accountId,
  debit: t.debit || 0,
  credit: t.credit || 0,
  type: t.debit ? "DEBIT" : "CREDIT", 
}));
    const entry = await prisma.journalEntry.create({
        data:{
            description,
            date,
            companyId,
            userId,
            transactions:{
                create:transactionsToCreate
            }
        },
    })
    return entry;
}