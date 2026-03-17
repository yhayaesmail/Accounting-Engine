import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;
  res.status(statusCode).json({
    success: false,
    message,
  });
};