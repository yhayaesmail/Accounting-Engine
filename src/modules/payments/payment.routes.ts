import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createPaymentController,
  deletePaymentController,
  getPaymentByIdController,
  getPaymentsController,
} from "./payment.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createPaymentController);
router.get("/", getPaymentsController);
router.get("/:id", getPaymentByIdController);
router.delete("/:id", deletePaymentController);

export default router;
