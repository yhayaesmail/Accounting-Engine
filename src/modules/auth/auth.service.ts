import prisma from "../../config/prisma.js";
import { logger } from "../../utils/logger.js";
import { hashPassword, comparePassword } from "../../utils/hashing.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../utils/errors.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from "./auth.validation.js";
import { redis } from "../../config/redis.js";

export const register = async (data: RegisterInput) => {
  try {
    const { error, value } = registerSchema.validate(data);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    let { email, password, companyName } = value;
    email = email.toLowerCase().trim();
    companyName = companyName.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictError("Email already exists");
    }
    const existingCompany = await prisma.company.findFirst({
      where: { name: companyName },
    });
    if (existingCompany) {
      throw new ConflictError("Company already exists");
    }
    const hashedPassword = await hashPassword(password);
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName },
      });
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "COMPANY_ADMIN",
          companyId: company.id,
        },
      });
      return { company, user };
    });
    const { user } = result;
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    });
    const sessionKey = `refresh_token:${user.id}`;
    await redis.set(sessionKey, refreshToken, "EX", 7 * 24 * 60 * 60);
    logger.info(`New company created: ${companyName}`);
    logger.info(`New admin registered: ${email}`);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  } catch (err: any) {
    logger.error(`Register error: ${err.message}`);
    throw err;
  }
};



export const login = async (data: LoginInput) => {
  try {
    const { error, value } = loginSchema.validate(data);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    let { email, password } = value;
    email = email.toLowerCase().trim();
    const rateKey = `login_attempts:${email}`;
    const attempts = await redis.get(rateKey);
    if (attempts && Number(attempts) >= 5) {
      throw new UnauthorizedError("Too many attempts, try later");
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      await redis.incr(rateKey);
      await redis.expire(rateKey, 60);
      throw new UnauthorizedError();
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      await redis.incr(rateKey);
      await redis.expire(rateKey, 60);
      throw new UnauthorizedError();
    }
    await redis.del(rateKey);
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    });
    const sessionKey = `refresh_token:${user.id}`;
    await redis.set(sessionKey, refreshToken, "EX", 7 * 24 * 60 * 60);
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  } catch (err: any) {
    logger.error(`Login error: ${err.message}`);
    throw err;
  }
};



export const logout = async (userId: string) => {
  try {
    const key = `refresh_token:${userId}`;
    const exists = await redis.get(key);
    if (!exists) {
      throw new UnauthorizedError("Already logged out");
    }
    await redis.del(key);
    logger.info(`User logged out: ${userId}`);
    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (err: any) {
    logger.error(`Logout error: ${err.message}`);
    throw err;
  }
};



export const refreshToken = async (data: RefreshTokenInput) => {
  try {
    const { error, value } = refreshTokenSchema.validate(data);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const { refreshToken } = value;
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedError("Invalid refresh token");
    }
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError("Refresh token mismatch");
    }
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId,
    });
    return {
      success: true,
      accessToken: newAccessToken,
    };
  } catch (err: any) {
    logger.error(`Refresh token error: ${err.message}`);
    throw err;
  }
};