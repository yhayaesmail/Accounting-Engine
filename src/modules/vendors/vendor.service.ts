import prisma from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { CreateVendorInput, UpdateVendorInput } from "./vendor.validation.js";

export const createVendor = async (data: CreateVendorInput) => {
  return prisma.vendor.create({
    data: {
      name: data.name,
      contact: data.contact || null,
      companyId: data.companyId,
    },
  });
};

export const getVendors = async (companyId: string) => {
  return prisma.vendor.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getVendorById = async (id: string, companyId: string) => {
  const vendor = await prisma.vendor.findFirst({
    where: {
      id,
      companyId,
      deletedAt: null,
    },
  });
  if (!vendor) {
    throw new NotFoundError("Vendor not found");
  }
  return vendor;
};

export const updateVendor = async (id: string, companyId: string, data: UpdateVendorInput) => {
  await getVendorById(id, companyId);
  return prisma.vendor.update({
    where: { id },
    data: {
      name: data.name,
      contact: data.contact || null,
    },
  });
};

export const deleteVendor = async (id: string, companyId: string) => {
  await getVendorById(id, companyId);
  return prisma.vendor.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};
