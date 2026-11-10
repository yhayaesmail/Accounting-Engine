/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPayment, getPayments, getPaymentById, deletePayment } from "./payment.service.js";
import prisma from "../../config/prisma.js";

vi.mock("../../config/prisma", () => ({
  default: {
    $transaction: vi.fn(),
    invoice: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("payment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const companyId = "company-1";
  const invoiceId = "invoice-1";
  const paymentId = "payment-1";

  describe("createPayment (without invoice)", () => {
    it("should create an unapplied payment successfully", async () => {
      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          payment: {
            create: vi.fn().mockResolvedValue({
              id: paymentId,
              amount: 100,
              method: "bank_transfer",
              invoiceId: null,
              companyId,
            }),
          },
        });
      });

      const result = await createPayment({
        amount: 100,
        method: "bank_transfer",
        companyId,
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(100);
      expect(result.invoiceId).toBeNull();
    });
  });

  describe("createPayment (linked to invoice)", () => {
    const mockInvoice = {
      id: invoiceId,
      companyId,
      total: 500,
      payments: [],
      deletedAt: null,
    };

    it("should create a payment within the invoice total", async () => {
      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          invoice: {
            findFirst: vi.fn().mockResolvedValue(mockInvoice),
            update: vi.fn().mockResolvedValue({ id: invoiceId, status: "DRAFT" }),
          },
          payment: {
            create: vi.fn().mockResolvedValue({
              id: paymentId,
              amount: 200,
              method: "cash",
              invoiceId,
              companyId,
            }),
          },
        });
      });

      const result = await createPayment({
        amount: 200,
        method: "cash",
        invoiceId,
        companyId,
      });

      expect(result.amount).toBe(200);
      expect(result.invoiceId).toBe(invoiceId);
    });

    it("should mark invoice as PAID when cumulative payments equal the total", async () => {
      const invoiceWithExistingPayment = {
        ...mockInvoice,
        payments: [{ amount: 300 }],
      };
      let txInvoiceUpdate: any;

      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        const tx = {
          invoice: {
            findFirst: vi.fn().mockResolvedValue(invoiceWithExistingPayment),
            update: vi.fn().mockResolvedValue({ id: invoiceId, status: "PAID" }),
          },
          payment: {
            create: vi.fn().mockResolvedValue({
              id: paymentId,
              amount: 200,
              method: "cash",
              invoiceId,
              companyId,
            }),
          },
        };
        txInvoiceUpdate = tx.invoice.update;
        return cb(tx);
      });

      await createPayment({
        amount: 200,
        method: "cash",
        invoiceId,
        companyId,
      });

      expect(txInvoiceUpdate).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: { status: "PAID" },
      });
    });

    it("should reject overpayment — payment exceeds remaining invoice total", async () => {
      const invoiceWithExistingPayment = {
        ...mockInvoice,
        payments: [{ amount: 400 }],
      };

      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          invoice: {
            findFirst: vi.fn().mockResolvedValue(invoiceWithExistingPayment),
          },
        });
      });

      // Remaining total = 500 - 400 = 100, but we try to pay 200
      await expect(
        createPayment({
          amount: 200,
          method: "cash",
          invoiceId,
          companyId,
        })
      ).rejects.toThrow("Payment exceeds invoice total");
    });

    it("should reject overpayment — no existing payments, payment exceeds invoice total", async () => {
      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          invoice: {
            findFirst: vi.fn().mockResolvedValue(mockInvoice),
          },
        });
      });

      // Invoice total = 500, trying to pay 600
      await expect(
        createPayment({
          amount: 600,
          method: "cash",
          invoiceId,
          companyId,
        })
      ).rejects.toThrow("Payment exceeds invoice total");
    });

    it("should throw if invoice does not exist", async () => {
      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          invoice: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(
        createPayment({
          amount: 100,
          method: "cash",
          invoiceId: "unknown",
          companyId,
        })
      ).rejects.toThrow("Invoice not found");
    });

    it("should throw if invoice is soft-deleted", async () => {
      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          invoice: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(
        createPayment({
          amount: 100,
          method: "cash",
          invoiceId,
          companyId,
        })
      ).rejects.toThrow("Invoice not found");
    });
  });

  describe("getPayments", () => {
    it("should return payments for the company, excluding soft-deleted", async () => {
      (prisma.payment.findMany as any).mockResolvedValue([
        { id: paymentId, amount: 100, deletedAt: null },
      ]);

      const result = await getPayments(companyId);

      expect(result).toHaveLength(1);
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: { companyId, deletedAt: null },
        include: { invoice: true },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return an empty array when there are no payments", async () => {
      (prisma.payment.findMany as any).mockResolvedValue([]);

      const result = await getPayments(companyId);

      expect(result).toEqual([]);
    });
  });

  describe("getPaymentById", () => {
    it("should return the payment when found", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue({
        id: paymentId,
        companyId,
        deletedAt: null,
      });

      const result = await getPaymentById(paymentId, companyId);

      expect(result).toBeDefined();
      expect(result.id).toBe(paymentId);
    });

    it("should throw if payment does not exist", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue(null);

      await expect(
        getPaymentById("unknown", companyId)
      ).rejects.toThrow("Payment not found");
    });
  });

  describe("deletePayment", () => {
    it("should soft-delete an existing payment", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue({
        id: paymentId,
        companyId,
        deletedAt: null,
      });
      (prisma.payment.update as any).mockResolvedValue({
        id: paymentId,
        deletedAt: new Date(),
      });

      const result = await deletePayment(paymentId, companyId);

      expect(result.deletedAt).toBeDefined();
    });

    it("should throw if payment does not exist", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue(null);

      await expect(
        deletePayment("unknown", companyId)
      ).rejects.toThrow("Payment not found");
    });
  });
});
