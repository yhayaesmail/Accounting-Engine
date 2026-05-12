import prisma from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { CreateCustomerInput, UpdateCustomerInput } from "./customer.validation.js";

export const createCustomer = async (data: CreateCustomerInput) => {
  return prisma.customer.create({
    data: {
      name: data.name,
      email: data.email || null,
      companyId: data.companyId,
    },
  });
};

export const getCustomers = async (companyId: string) => {
  return prisma.customer.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getCustomerById = async (id: string, companyId: string) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id,
      companyId,
      deletedAt: null,
    },
    include: {
      invoices: true,
    },
  });
  if (!customer) {
    throw new NotFoundError("Customer not found");
  }
  return customer;
};

export const updateCustomer = async (id: string, companyId: string, data: UpdateCustomerInput) => {
  await getCustomerById(id, companyId);
  return prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
    },
  });
};

export const deleteCustomer = async (id: string, companyId: string) => {
  await getCustomerById(id, companyId);
  return prisma.customer.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};
