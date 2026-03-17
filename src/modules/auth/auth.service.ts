import prisma from "../../config/prisma.js";
import { logger } from "../../utils/logger.js";
import { hashPassword , comparePassword } from "../../utils/hashing.js";
import { generateAccessToken,generateRefreshToken } from "../../utils/jwt.js";
import { Role } from "../../generated/prisma/enums.js";
import { redis } from "../../config/redis.js";

export const register = async (email:string , password:string,role:string,companyId:string)=>{
    try {
            if(!email || !password){
        throw new Error("Email and password are required");
    }
    const exitingEmail = await prisma.user.findUnique({
        where:{ email }
    })
    if(exitingEmail){
        throw new Error("Email Already Registered once Try Agian");
    }
    if (password.length < 8) {
        throw new Error("Password too short, min 8 chars")};
    if (!Object.values(Role).includes(Role.COMPANY)) {
        throw new Error("Invalid role");}
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data:{
            email,
            password:hashedPassword,
            role:Role.COMPANY,
            companyId
        }
    })
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await redis.set(`refresh_token:${user.id}`,refreshToken,"EX",7*24*60*60);
    logger.info(`New user registered : ${email} (id): ${user.id}`)
    return {
        success: true,
        id:user.id,
        role:user.role,
        email:user.email,
        accessToken,
        refreshToken,
        createdAt:user.createdAt
    };
    } catch (err: any) {
        logger.error(`Register error for email ${email}: ${err.message}`);
        throw err;
    }
}



export const login = async (email:string,password:string)=>{
    try {
        if(!email||!password){throw new Error("Email and Password Are required")}
        const user = await prisma.user.findUnique({
            where:{email}
        });
        if(!user){
            logger.warn(`Login failed - email not found: ${email}`);
            throw new Error(`Invalid credentials`)};
        const isMatch = await comparePassword(password,user.password);
        if(!isMatch){
            logger.warn(`login Failed - Wornd password for email ${email}`);
            throw new Error("credentials");
        };
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        await redis.set(`refresh_token:${user.id}`,refreshToken,"EX",7*24*60*60);
        logger.info(`User logged in successfully: ${email}, (id: ${user.id})`);
        return {
            success: true,
            id:user.id,
            email:user.email,
            role:user.role,
            accessToken,
            refreshToken
        }
    } catch (err:any) {
        logger.error(`login error for email ${email}, ${err.message}`);
        throw err;
    }
}