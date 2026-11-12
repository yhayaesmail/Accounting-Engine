import prisma from "../../config/prisma.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";
import { CreateVendorBillInput } from "./vendorBill.validation.js";

export const createVendorBill = async (data: CreateVendorBillInput) => {
  const vendor = await prisma.vendor.findFirst({
    where: {
      id: data.vendorId,
      companyId: data.companyId,
      deletedAt: null,
    },
  });
  if (!vendor) {
    throw new BadRequestError("Vendor not found");
  }
  return prisma.vendorBill.create({
    data: {
      vendorId: data.vendorId,
      companyId: data.companyId,
      total: data.total,
      status: "OPEN",
      issuedAt: data.issuedAt,
    },
    include: {
      vendor: true,
    },
  });
};

export const getVendorBills = async (companyId: string) => {
  return prisma.vendorBill.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    include: {
      vendor: true,
    },
    orderBy: {
      issuedAt: "desc",
    },
  });
};

export const getVendorBillById = async (id: string, companyId: string) => {
  const bill = await prisma.vendorBill.findFirst({
    where: {
      id,
      companyId,
      deletedAt: null,
    },
    include: {
      vendor: true,
    },
  });
  if (!bill) {
    throw new NotFoundError("Vendor bill not found");
  }
  return bill;
};

export const payVendorBill = async (id: string, companyId: string) => {
  const bill = await getVendorBillById(id, companyId);
  if (bill.status === "PAID") {
    throw new BadRequestError("Vendor bill is already paid");
  }
  return prisma.vendorBill.update({
    where: { id: bill.id },
    data: {
      status: "PAID",
    },
    include: {
      vendor: true,
    },
  });
};

export const deleteVendorBill = async (id: string, companyId: string) => {
  await getVendorBillById(id, companyId);
  return prisma.vendorBill.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};
