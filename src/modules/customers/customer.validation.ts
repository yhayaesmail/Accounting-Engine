import Joi from "joi";

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().optional().allow("", null),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  email: Joi.string().email().optional().allow("", null),
}).min(1);

export type CreateCustomerInput = {
  name: string;
  email?: string | null;
  companyId: string;
};

export type UpdateCustomerInput = Partial<Omit<CreateCustomerInput, "companyId">>;
