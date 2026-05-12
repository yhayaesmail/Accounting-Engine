import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { dashboardController, trialBalanceController } from "./report.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/dashboard", dashboardController);
router.get("/trial-balance", trialBalanceController);

export default router;
