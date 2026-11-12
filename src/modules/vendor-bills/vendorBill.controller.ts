import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/auth.types.js";
import { BadRequestError } from "../../utils/errors.js";
import { validateRequest } from "../../utils/validation.js";
import * as vendorBillService from "./vendorBill.service.js";
import { createVendorBillSchema, type CreateVendorBillInput } from "./vendorBill.validation.js";

export const createVendorBillController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const value = validateRequest<CreateVendorBillInput>(createVendorBillSchema, req.body);
    const bill = await vendorBillService.createVendorBill({ ...value, companyId: req.user.companyId });
    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

export const getVendorBillsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const bills = await vendorBillService.getVendorBills(req.user.companyId);
    res.status(200).json({ success: true, data: bills });
  } catch (err) {
    next(err);
  }
};

export const payVendorBillController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const bill = await vendorBillService.payVendorBill(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

export const deleteVendorBillController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const bill = await vendorBillService.deleteVendorBill(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};
