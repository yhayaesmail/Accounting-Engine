import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors.js";

export const allowRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return next(new UnauthorizedError("Forbidden"));
    }
    next();
  };
};