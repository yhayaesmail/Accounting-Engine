import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/auth.types.js";
import { BadRequestError } from "../../utils/errors.js";
import * as reportService from "./report.service.js";

export const dashboardController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const dashboard = await reportService.getDashboard(req.user.companyId);
    res.status(200).json({ success: true, data: dashboard });
  } catch (err) {
    next(err);
  }
};

export const trialBalanceController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const trialBalance = await reportService.getTrialBalance(req.user.companyId);
    res.status(200).json({ success: true, data: trialBalance });
  } catch (err) {
    next(err);
  }
};
