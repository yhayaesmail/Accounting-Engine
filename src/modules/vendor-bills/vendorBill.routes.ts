import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createVendorBillController,
  deleteVendorBillController,
  getVendorBillsController,
  payVendorBillController,
} from "./vendorBill.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createVendorBillController);
router.get("/", getVendorBillsController);
router.post("/:id/pay", payVendorBillController);
router.delete("/:id", deleteVendorBillController);

export default router;
