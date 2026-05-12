import Joi from "joi";

export const createInvoiceSchema = Joi.object({
  customerId: Joi.string().required(),
  total: Joi.number().positive().required(),
  status: Joi.string().valid("DRAFT", "SENT", "PAID", "CANCELLED").default("DRAFT"),
  issuedAt: Joi.date().optional(),
});

export const updateInvoiceSchema = Joi.object({
  total: Joi.number().positive().optional(),
  status: Joi.string().valid("DRAFT", "SENT", "PAID", "CANCELLED").optional(),
  issuedAt: Joi.date().optional(),
}).min(1);

export type CreateInvoiceInput = {
  customerId: string;
  total: number;
  status?: string;
  issuedAt?: Date;
  companyId: string;
};

export type UpdateInvoiceInput = Partial<Omit<CreateInvoiceInput, "companyId" | "customerId">>;
