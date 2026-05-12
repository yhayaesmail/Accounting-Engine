import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types/auth.types.js";
import { BadRequestError } from "../../utils/errors.js";
import { createJournalSchema } from "./journal.validation.js";
import * as journalService from "./journal.service.js";

export const createJournalEntryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId || !req.user.companyId) {
      throw new BadRequestError("User company is required");
    }
    const { error, value } = createJournalSchema.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const entry = await journalService.createJournalEntry({
      ...value,
      userId: req.user.userId,
      companyId: req.user.companyId,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

export const getAllJournalEntriesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const entries = await journalService.getAllJournalEntries(req.user.companyId, page, limit);
    res.status(200).json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
};

export const getJournalEntryByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const entry = await journalService.getJournalEntryById(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

export const deleteJournalEntryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const entry = await journalService.deleteJournalEntry(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

export const postJournalEntryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.companyId) {
      throw new BadRequestError("User company is required");
    }
    const entry = await journalService.postJournalEntry(req.params.id as string, req.user.companyId);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};
