import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;
  logger.error(`[${req.method}] ${req.originalUrl} - ${message}`);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};