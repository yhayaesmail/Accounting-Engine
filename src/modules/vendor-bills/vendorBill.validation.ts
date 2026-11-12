import Joi from "joi";

export const createVendorBillSchema = Joi.object({
  vendorId: Joi.string().required(),
  total: Joi.number().positive().required(),
  issuedAt: Joi.date().optional(),
});

export type CreateVendorBillInput = {
  vendorId: string;
  total: number;
  issuedAt?: Date;
  companyId: string;
};
