import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/auth.types.js";
import { BadRequestError } from "../../utils/errors.js";
import * as accountService from "./account.service.js";
import { createAccountSchema, updateAccountSchema } from "./account.validation.js";

export const createAccountController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const { error, value } = createAccountSchema.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const account = await accountService.createAccount({ ...value, companyId: req.user.companyId });
    res.status(201).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};

export const getAccountsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const accounts = await accountService.getAccounts(req.user.companyId);
    res.status(200).json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
};

export const getAccountByIdController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const account = await accountService.getAccountById(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};

export const updateAccountController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const { error, value } = updateAccountSchema.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const account = await accountService.updateAccount(req.params.id as string, req.user.companyId, value);
    res.status(200).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};

export const deleteAccountController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const account = await accountService.deleteAccount(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};
