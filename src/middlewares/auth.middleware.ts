import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    companyId?: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedError("Invalid token payload");
    }
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId ?? undefined,
    };
    next();
  } catch (err) {
    next(new UnauthorizedError("Invalid token"));
  }
};