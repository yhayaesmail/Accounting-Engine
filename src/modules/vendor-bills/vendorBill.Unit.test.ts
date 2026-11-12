/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createVendorBill,
  getVendorBills,
  getVendorBillById,
  payVendorBill,
  deleteVendorBill,
} from "./vendorBill.service.js";
import prisma from "../../config/prisma.js";

vi.mock("../../config/prisma", () => ({
  default: {
    vendor: {
      findFirst: vi.fn(),
    },
    vendorBill: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("vendorBill service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const companyId = "company-1";
  const vendorId = "vendor-1";
  const billId = "bill-1";

  const mockVendor = {
    id: vendorId,
    name: "Pacific Paper Supply",
    companyId,
    deletedAt: null,
  };

  const mockBill = {
    id: billId,
    vendorId,
    companyId,
    total: 1200,
    status: "OPEN",
    issuedAt: new Date("2026-11-12"),
    deletedAt: null,
    vendor: mockVendor,
  };

  describe("createVendorBill", () => {
    it("should create a bill in OPEN status when the vendor exists", async () => {
      (prisma.vendor.findFirst as any).mockResolvedValue(mockVendor);
      (prisma.vendorBill.create as any).mockResolvedValue(mockBill);

      const result = await createVendorBill({
        vendorId,
        total: 1200,
        companyId,
      });

      expect(result.status).toBe("OPEN");
      expect(result.total).toBe(1200);
      expect(prisma.vendorBill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            vendorId,
            companyId,
            total: 1200,
            status: "OPEN",
          }),
        })
      );
    });

    it("should throw when the vendor does not exist in the company", async () => {
      (prisma.vendor.findFirst as any).mockResolvedValue(null);

      await expect(
        createVendorBill({ vendorId, total: 1200, companyId })
      ).rejects.toThrow("Vendor not found");
      expect(prisma.vendorBill.create).not.toHaveBeenCalled();
    });
  });

  describe("getVendorBills", () => {
    it("should list bills scoped to the company including the vendor", async () => {
      (prisma.vendorBill.findMany as any).mockResolvedValue([mockBill]);

      const result = await getVendorBills(companyId);

      expect(result).toHaveLength(1);
      expect(result[0].vendor.name).toBe("Pacific Paper Supply");
      expect(prisma.vendorBill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId, deletedAt: null },
        })
      );
    });
  });

  describe("getVendorBillById", () => {
    it("should return the bill when it exists", async () => {
      (prisma.vendorBill.findFirst as any).mockResolvedValue(mockBill);

      const result = await getVendorBillById(billId, companyId);

      expect(result.id).toBe(billId);
    });

    it("should throw NotFoundError when the bill does not exist", async () => {
      (prisma.vendorBill.findFirst as any).mockResolvedValue(null);

      await expect(getVendorBillById(billId, companyId)).rejects.toThrow(
        "Vendor bill not found"
      );
    });
  });

  describe("payVendorBill", () => {
    it("should mark an OPEN bill as PAID", async () => {
      (prisma.vendorBill.findFirst as any).mockResolvedValue(mockBill);
      (prisma.vendorBill.update as any).mockResolvedValue({
        ...mockBill,
        status: "PAID",
      });

      const result = await payVendorBill(billId, companyId);

      expect(result.status).toBe("PAID");
      expect(prisma.vendorBill.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: billId },
          data: { status: "PAID" },
        })
      );
    });

    it("should reject paying an already PAID bill", async () => {
      (prisma.vendorBill.findFirst as any).mockResolvedValue({
        ...mockBill,
        status: "PAID",
      });

      await expect(payVendorBill(billId, companyId)).rejects.toThrow(
        "Vendor bill is already paid"
      );
      expect(prisma.vendorBill.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteVendorBill", () => {
    it("should soft-delete the bill", async () => {
      (prisma.vendorBill.findFirst as any).mockResolvedValue(mockBill);
      (prisma.vendorBill.update as any).mockResolvedValue({
        ...mockBill,
        deletedAt: new Date(),
      });

      await deleteVendorBill(billId, companyId);

      expect(prisma.vendorBill.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: billId },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });
  });
});
