import {
  refreshTokenController,
  registerController,
  loginController,
  logoutController
} from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.post('/register-company', registerController);
router.post('/login', loginController);
router.post('/refresh',authMiddleware, refreshTokenController);
router.post('/logout',authMiddleware, logoutController); 

export default router;