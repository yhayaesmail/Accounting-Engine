import Joi from "joi";

export const createVendorSchema = Joi.object({
  name: Joi.string().min(2).required(),
  contact: Joi.string().optional().allow("", null),
});

export const updateVendorSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  contact: Joi.string().optional().allow("", null),
}).min(1);

export type CreateVendorInput = {
  name: string;
  contact?: string | null;
  companyId: string;
};

export type UpdateVendorInput = Partial<Omit<CreateVendorInput, "companyId">>;
