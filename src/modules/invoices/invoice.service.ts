import prisma from "../../config/prisma.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";
import { CreateInvoiceInput, UpdateInvoiceInput } from "./invoice.validation.js";

export const createInvoice = async (data: CreateInvoiceInput) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: data.customerId,
      companyId: data.companyId,
      deletedAt: null,
    },
  });
  if (!customer) {
    throw new BadRequestError("Customer not found");
  }
  return prisma.invoice.create({
    data: {
      customerId: data.customerId,
      companyId: data.companyId,
      total: data.total,
      status: data.status ?? "DRAFT",
      issuedAt: data.issuedAt,
    },
    include: {
      customer: true,
      payments: true,
    },
  });
};

export const getInvoices = async (companyId: string) => {
  return prisma.invoice.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    include: {
      customer: true,
      payments: true,
    },
    orderBy: {
      issuedAt: "desc",
    },
  });
};

export const getInvoiceById = async (id: string, companyId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      companyId,
      deletedAt: null,
    },
    include: {
      customer: true,
      payments: true,
    },
  });
  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  }
  return invoice;
};

export const updateInvoice = async (id: string, companyId: string, data: UpdateInvoiceInput) => {
  await getInvoiceById(id, companyId);
  return prisma.invoice.update({
    where: { id },
    data,
    include: {
      customer: true,
      payments: true,
    },
  });
};

export const deleteInvoice = async (id: string, companyId: string) => {
  await getInvoiceById(id, companyId);
  return prisma.invoice.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};
