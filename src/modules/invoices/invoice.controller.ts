import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/auth.types.js";
import { BadRequestError } from "../../utils/errors.js";
import { validateRequest } from "../../utils/validation.js";
import * as invoiceService from "./invoice.service.js";
import { createInvoiceSchema, updateInvoiceSchema, type CreateInvoiceInput, type UpdateInvoiceInput } from "./invoice.validation.js";

export const createInvoiceController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const value = validateRequest<CreateInvoiceInput>(createInvoiceSchema, req.body);
    const invoice = await invoiceService.createInvoice({ ...value, companyId: req.user.companyId });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

export const getInvoicesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const invoices = await invoiceService.getInvoices(req.user.companyId);
    res.status(200).json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const invoice = await invoiceService.getInvoiceById(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

export const updateInvoiceController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const value = validateRequest<UpdateInvoiceInput>(updateInvoiceSchema, req.body);
    const invoice = await invoiceService.updateInvoice(req.params.id as string, req.user.companyId, value);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

export const deleteInvoiceController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const invoice = await invoiceService.deleteInvoice(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};
