/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "./invoice.service.js";
import prisma from "../../config/prisma.js";

vi.mock("../../config/prisma", () => ({
  default: {
    customer: {
      findFirst: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("invoice service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const companyId = "company-1";
  const customerId = "customer-1";
  const invoiceId = "invoice-1";

  describe("createInvoice", () => {
    it("should create an invoice successfully", async () => {
      (prisma.customer.findFirst as any).mockResolvedValue({
        id: customerId,
        name: "Acme Corp",
        companyId,
        deletedAt: null,
      });
      (prisma.invoice.create as any).mockResolvedValue({
        id: invoiceId,
        customerId,
        companyId,
        total: 500,
        status: "DRAFT",
        deletedAt: null,
      });

      const result = await createInvoice({
        customerId,
        total: 500,
        companyId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(invoiceId);
      expect(result.total).toBe(500);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: customerId,
          companyId,
          deletedAt: null,
        },
      });
      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: {
          customerId,
          companyId,
          total: 500,
          status: "DRAFT",
          issuedAt: undefined,
        },
        include: {
          customer: true,
          payments: true,
        },
      });
    });

    it("should throw if customer does not exist", async () => {
      (prisma.customer.findFirst as any).mockResolvedValue(null);

      await expect(
        createInvoice({ customerId: "unknown", total: 100, companyId })
      ).rejects.toThrow("Customer not found");
    });

    it("should throw if customer belongs to another company", async () => {
      (prisma.customer.findFirst as any).mockResolvedValue(null);

      await expect(
        createInvoice({ customerId, total: 100, companyId: "other-company" })
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("getInvoices", () => {
    it("should return invoices for the company, excluding soft-deleted", async () => {
      (prisma.invoice.findMany as any).mockResolvedValue([
        { id: invoiceId, total: 100, deletedAt: null },
      ]);

      const result = await getInvoices(companyId);

      expect(result).toHaveLength(1);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: { companyId, deletedAt: null },
        include: { customer: true, payments: true },
        orderBy: { issuedAt: "desc" },
      });
    });

    it("should return an empty array when there are no invoices", async () => {
      (prisma.invoice.findMany as any).mockResolvedValue([]);

      const result = await getInvoices(companyId);

      expect(result).toEqual([]);
    });
  });

  describe("getInvoiceById", () => {
    it("should return the invoice when found", async () => {
      (prisma.invoice.findFirst as any).mockResolvedValue({
        id: invoiceId,
        companyId,
        deletedAt: null,
      });

      const result = await getInvoiceById(invoiceId, companyId);

      expect(result).toBeDefined();
      expect(result.id).toBe(invoiceId);
    });

    it("should throw if invoice does not exist", async () => {
      (prisma.invoice.findFirst as any).mockResolvedValue(null);

      await expect(
        getInvoiceById("unknown", companyId)
      ).rejects.toThrow("Invoice not found");
    });

    it("should throw if invoice is soft-deleted", async () => {
      (prisma.invoice.findFirst as any).mockResolvedValue(null);

      await expect(
        getInvoiceById(invoiceId, companyId)
      ).rejects.toThrow("Invoice not found");
    });
  });

  describe("updateInvoice", () => {
    it("should update an existing invoice", async () => {
      (prisma.invoice.findFirst as any).mockResolvedValue({
        id: invoiceId,
        companyId,
        deletedAt: null,
      });
      (prisma.invoice.update as any).mockResolvedValue({
        id: invoiceId,
        total: 750,
      });

      const result = await updateInvoice(invoiceId, companyId, {
        total: 750,
      });

      expect(result.total).toBe(750);
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: { total: 750 },
        include: { customer: true, payments: true },
      });
    });

    it("should throw if invoice does not exist", async () => {
      (prisma.invoice.findFirst as any).mockResolvedValue(null);

      await expect(
        updateInvoice("unknown", companyId, { total: 100 })
      ).rejects.toThrow("Invoice not found");
    });
  });

  describe("deleteInvoice", () => {
    it("should soft-delete an existing invoice", async () => {
      (prisma.invoice.findFirst as any).mockResolvedValue({
        id: invoiceId,
        companyId,
        deletedAt: null,
      });
      (prisma.invoice.update as any).mockResolvedValue({
        id: invoiceId,
        deletedAt: new Date(),
      });

      const result = await deleteInvoice(invoiceId, companyId);

      expect(result.deletedAt).toBeDefined();
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it("should throw if invoice does not exist", async () => {
      (prisma.invoice.findFirst as any).mockResolvedValue(null);

      await expect(
        deleteInvoice("unknown", companyId)
      ).rejects.toThrow("Invoice not found");
    });
  });
});
