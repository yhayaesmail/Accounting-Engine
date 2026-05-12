import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createVendorController,
  deleteVendorController,
  getVendorByIdController,
  getVendorsController,
  updateVendorController,
} from "./vendor.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createVendorController);
router.get("/", getVendorsController);
router.get("/:id", getVendorByIdController);
router.patch("/:id", updateVendorController);
router.delete("/:id", deleteVendorController);

export default router;
