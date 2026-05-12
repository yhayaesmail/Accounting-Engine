import prisma from "../../config/prisma.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";
import { CreatePaymentInput } from "./payment.validation.js";

export const createPayment = async (data: CreatePaymentInput) => {
  return prisma.$transaction(async (tx) => {
    if (data.invoiceId) {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: data.invoiceId,
          companyId: data.companyId,
          deletedAt: null,
        },
        include: {
          payments: true,
        },
      });
      if (!invoice) {
        throw new BadRequestError("Invoice not found");
      }
      const paidBefore = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const nextPaid = paidBefore + data.amount;
      if (nextPaid > invoice.total) {
        throw new BadRequestError("Payment exceeds invoice total");
      }
      const payment = await tx.payment.create({
        data: {
          amount: data.amount,
          method: data.method,
          invoiceId: data.invoiceId,
          companyId: data.companyId,
        },
      });
      if (nextPaid === invoice.total) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: "PAID" },
        });
      }
      return payment;
    }
    return tx.payment.create({
      data: {
        amount: data.amount,
        method: data.method,
        invoiceId: null,
        companyId: data.companyId,
      },
    });
  });
};

export const getPayments = async (companyId: string) => {
  return prisma.payment.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    include: {
      invoice: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getPaymentById = async (id: string, companyId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      companyId,
      deletedAt: null,
    },
    include: {
      invoice: true,
    },
  });
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }
  return payment;
};

export const deletePayment = async (id: string, companyId: string) => {
  await getPaymentById(id, companyId);
  return prisma.payment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};
