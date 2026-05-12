import prisma from "../../config/prisma.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors.js";
import { CreateAccountInput, UpdateAccountInput } from "./account.validation.js";

export const createAccount = async (data: CreateAccountInput) => {
  const existing = await prisma.account.findFirst({
    where: {
      code: data.code,
      companyId: data.companyId,
      deletedAt: null,
    },
  });
  if (existing) {
    throw new ConflictError("Account code already exists");
  }
  if (data.parentId) {
    const parent = await prisma.account.findFirst({
      where: {
        id: data.parentId,
        companyId: data.companyId,
        deletedAt: null,
      },
    });
    if (!parent) {
      throw new BadRequestError("Parent account not found");
    }
  }
  return prisma.account.create({
    data: {
      name: data.name,
      code: data.code,
      type: data.type,
      currency: data.currency ?? "USD",
      companyId: data.companyId,
      parentId: data.parentId || null,
    },
  });
};

export const getAccounts = async (companyId: string) => {
  return prisma.account.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    orderBy: {
      code: "asc",
    },
    include: {
      children: true,
    },
  });
};

export const getAccountById = async (id: string, companyId: string) => {
  const account = await prisma.account.findFirst({
    where: {
      id,
      companyId,
      deletedAt: null,
    },
    include: {
      transactions: true,
      children: true,
    },
  });
  if (!account) {
    throw new NotFoundError("Account not found");
  }
  return account;
};

export const updateAccount = async (id: string, companyId: string, data: UpdateAccountInput) => {
  await getAccountById(id, companyId);
  if (data.code) {
    const existing = await prisma.account.findFirst({
      where: {
        code: data.code,
        companyId,
        deletedAt: null,
        NOT: {
          id,
        },
      },
    });
    if (existing) {
      throw new ConflictError("Account code already exists");
    }
  }
  if (data.parentId) {
    if (data.parentId === id) {
      throw new BadRequestError("Account cannot be parent of itself");
    }
    const parent = await prisma.account.findFirst({
      where: {
        id: data.parentId,
        companyId,
        deletedAt: null,
      },
    });
    if (!parent) {
      throw new BadRequestError("Parent account not found");
    }
  }
  const updateData = { ...data };
  if ("parentId" in updateData) {
    updateData.parentId = updateData.parentId || null;
  }
  return prisma.account.update({
    where: { id },
    data: updateData,
  });
};

export const deleteAccount = async (id: string, companyId: string) => {
  const account = await getAccountById(id, companyId);
  if (account.transactions.length > 0) {
    throw new ConflictError("Account has transactions");
  }
  if (account.children.some((child) => !child.deletedAt)) {
    throw new ConflictError("Account has child accounts");
  }
  return prisma.account.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};
