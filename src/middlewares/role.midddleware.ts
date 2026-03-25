import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth.types.js";
import { ForbiddenError } from "../utils/errors.js";

export const allowRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return next(new ForbiddenError("Access denied"));
    }

    next();
  };
};