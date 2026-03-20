import Joi from "joi";

export const createJournalSchema = Joi.object({
  description: Joi.string().optional(),
  date: Joi.date().optional(),
  companyId: Joi.string().required(),
  userId: Joi.string().required(),
  transactions: Joi.array()
    .items(
      Joi.object({
        accountId: Joi.string().required(),
        debit: Joi.number().min(0).optional(),
        credit: Joi.number().min(0).optional(),
      })
    )
    .min(2)
    .required(),
});


export type TransactionInput = {
  accountId: string;
  debit?: number;   
  credit?: number;
};

export type CreateJournalEntryInput = {
  description: string;
  date?: Date;
  companyId: string;
  userId: string;
  transactions: TransactionInput[];
};