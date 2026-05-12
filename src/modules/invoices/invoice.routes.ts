import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createInvoiceController,
  deleteInvoiceController,
  getInvoiceByIdController,
  getInvoicesController,
  updateInvoiceController,
} from "./invoice.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createInvoiceController);
router.get("/", getInvoicesController);
router.get("/:id", getInvoiceByIdController);
router.patch("/:id", updateInvoiceController);
router.delete("/:id", deleteInvoiceController);

export default router;
