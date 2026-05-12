import Joi from "joi";

export const createAccountSchema = Joi.object({
  name: Joi.string().min(2).required(),
  code: Joi.string().min(1).required(),
  type: Joi.string().valid("ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE").required(),
  currency: Joi.string().length(3).default("USD"),
  parentId: Joi.string().optional().allow(null, ""),
});

export const updateAccountSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  code: Joi.string().min(1).optional(),
  type: Joi.string().valid("ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE").optional(),
  currency: Joi.string().length(3).optional(),
  parentId: Joi.string().optional().allow(null, ""),
}).min(1);

export type CreateAccountInput = {
  name: string;
  code: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  currency?: string;
  parentId?: string | null;
  companyId: string;
};

export type UpdateAccountInput = Partial<Omit<CreateAccountInput, "companyId">>;
