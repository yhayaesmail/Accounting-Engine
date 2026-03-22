import { describe, it, expect, beforeEach } from "vitest";
import { register,login,logout,refreshToken } from "../auth/auth.service";
import prisma from "../../config/prisma";
import { redis } from "../../config/redis";

beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await redis.flushall();
});

describe("Auth Integration Tests", () => {
  // ================= REGISTER =================
  describe("Register", () => {
    it("should register new user successfully", async () => {
      const result = await register({
        email: "test@test.com",
        password: "12345678",
        companyName: "testCompany",
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe("test@test.com");
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it("should convert email to lowercase", async () => {
      const result = await register({
        email: "TEST@TEST.COM",
        password: "12345678",
        companyName: "company1",
      });

      expect(result.user.email).toBe("test@test.com");
    });

    it("should throw error if email already exists", async () => {
      await register({
        email: "test@test.com",
        password: "12345678",
        companyName: "company1",
      });

      await expect(
        register({
          email: "test@test.com",
          password: "12345678",
          companyName: "company2",
        })
      ).rejects.toThrow();
    });

    it("should throw error if company already exists", async () => {
      await register({
        email: "a@test.com",
        password: "12345678",
        companyName: "sameCompany",
      });

      await expect(
        register({
          email: "b@test.com",
          password: "12345678",
          companyName: "sameCompany",
        })
      ).rejects.toThrow();
    });

    it("should fail if password less than 8", async () => {
      await expect(
        register({
          email: "fail@test.com",
          password: "123",
          companyName: "failCompany",
        })
      ).rejects.toThrow();
    });
  });






  // ================= LOGIN =================
  describe("Login", () => {
    it("should login successfully", async () => {
      await register({
        email: "test@test.com",
        password: "12345678",
        companyName: "testCompany",
      });

      const result = await login({
        email: "test@test.com",
        password: "12345678",
      });

      expect(result.success).toBe(true);
      expect(result.tokens.accessToken).toBeDefined();
    });

    it("should fail if user not found", async () => {
      await expect(
        login({
          email: "notfound@test.com",
          password: "12345678",
        })
      ).rejects.toThrow();
    });

    it("should fail if password is wrong", async () => {
      await register({
        email: "test@test.com",
        password: "12345678",
        companyName: "testCompany",
      });

      await expect(
        login({
          email: "test@test.com",
          password: "wrongpass",
        })
      ).rejects.toThrow();
    });

    it("should block after too many attempts", async () => {
      await register({
        email: "test@test.com",
        password: "12345678",
        companyName: "testCompany",
      });
      for (let i = 0; i < 5; i++) {
        try {
          await login({
            email: "test@test.com",
            password: "wrong",
          });
        } catch {}
      }
      await expect(
        login({
          email: "test@test.com",
          password: "12345678",
        })
      ).rejects.toThrow("Too many attempts");
    });
  });




  // ================= REFRESH TOKEN =================
  describe("Refresh Token", () => {
    it("should refresh access token", async () => {
      const reg = await register({
        email: "test@test.com",
        password: "12345678",
        companyName: "testCompany",
      });

      const result = await refreshToken({
        refreshToken: reg.tokens.refreshToken,
      });

      expect(result.accessToken).toBeDefined();
    });

    it("should fail with invalid token", async () => {
      await expect(
        refreshToken({
          refreshToken: "fake_token",
        })
      ).rejects.toThrow();
    });
  });





  // ================= LOGOUT =================
  describe("Logout", () => {
    it("should logout successfully", async () => {
      const reg = await register({
        email: "test@test.com",
        password: "12345678",
        companyName: "testCompany",
      });

      const result = await logout(reg.user.id);

      expect(result.success).toBe(true);
    });

    it("should fail if already logged out", async () => {
      const reg = await register({
        email: "test@test.com",
        password: "12345678",
        companyName: "testCompany",
      });

      await logout(reg.user.id);

      await expect(logout(reg.user.id)).rejects.toThrow();
    });
  });
});