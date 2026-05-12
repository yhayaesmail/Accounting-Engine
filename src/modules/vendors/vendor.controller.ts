import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/auth.types.js";
import { BadRequestError } from "../../utils/errors.js";
import * as vendorService from "./vendor.service.js";
import { createVendorSchema, updateVendorSchema } from "./vendor.validation.js";

export const createVendorController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const { error, value } = createVendorSchema.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const vendor = await vendorService.createVendor({ ...value, companyId: req.user.companyId });
    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

export const getVendorsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const vendors = await vendorService.getVendors(req.user.companyId);
    res.status(200).json({ success: true, data: vendors });
  } catch (err) {
    next(err);
  }
};

export const getVendorByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const vendor = await vendorService.getVendorById(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

export const updateVendorController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const { error, value } = updateVendorSchema.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const vendor = await vendorService.updateVendor(req.params.id as string, req.user.companyId, value);
    res.status(200).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

export const deleteVendorController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const vendor = await vendorService.deleteVendor(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};
