import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createCustomerController,
  deleteCustomerController,
  getCustomerByIdController,
  getCustomersController,
  updateCustomerController,
} from "./customer.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createCustomerController);
router.get("/", getCustomersController);
router.get("/:id", getCustomerByIdController);
router.patch("/:id", updateCustomerController);
router.delete("/:id", deleteCustomerController);

export default router;
