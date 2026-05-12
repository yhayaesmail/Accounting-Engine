import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/auth.types.js";
import { BadRequestError } from "../../utils/errors.js";
import * as paymentService from "./payment.service.js";
import { createPaymentSchema } from "./payment.validation.js";

export const createPaymentController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const { error, value } = createPaymentSchema.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const payment = await paymentService.createPayment({ ...value, companyId: req.user.companyId });
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

export const getPaymentsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const payments = await paymentService.getPayments(req.user.companyId);
    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

export const getPaymentByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const payment = await paymentService.getPaymentById(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

export const deletePaymentController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const payment = await paymentService.deletePayment(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};
