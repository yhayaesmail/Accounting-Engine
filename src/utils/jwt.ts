import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuid } from "uuid";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;

interface TokenPayload extends JwtPayload {
  userId: string;
  role: string;
  companyId?: string | null;
}

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(
    { ...payload, jti: uuid() },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(
    { ...payload, jti: uuid() },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
};
