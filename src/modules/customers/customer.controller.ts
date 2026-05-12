import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/auth.types.js";
import { BadRequestError } from "../../utils/errors.js";
import * as customerService from "./customer.service.js";
import { createCustomerSchema, updateCustomerSchema } from "./customer.validation.js";

export const createCustomerController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const { error, value } = createCustomerSchema.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const customer = await customerService.createCustomer({ ...value, companyId: req.user.companyId });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

export const getCustomersController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const customers = await customerService.getCustomers(req.user.companyId);
    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
};

export const getCustomerByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const customer = await customerService.getCustomerById(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

export const updateCustomerController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const { error, value } = updateCustomerSchema.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const customer = await customerService.updateCustomer(req.params.id as string, req.user.companyId, value);
    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomerController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const customer = await customerService.deleteCustomer(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};
