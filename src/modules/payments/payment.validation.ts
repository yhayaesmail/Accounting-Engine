import Joi from "joi";

export const createPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  method: Joi.string().min(2).required(),
  invoiceId: Joi.string().optional().allow(null, ""),
});

export type CreatePaymentInput = {
  amount: number;
  method: string;
  invoiceId?: string | null;
  companyId: string;
};
