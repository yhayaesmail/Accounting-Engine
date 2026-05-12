import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  createAccountController,
  deleteAccountController,
  getAccountByIdController,
  getAccountsController,
  updateAccountController,
} from "./account.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/", createAccountController);
router.get("/", getAccountsController);
router.get("/:id", getAccountByIdController);
router.patch("/:id", updateAccountController);
router.delete("/:id", deleteAccountController);

export default router;
