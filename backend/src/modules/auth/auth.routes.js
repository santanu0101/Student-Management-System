import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./auth.validation.js";
import { AuthController } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { loginRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(AuthController.register));

router.post(
  "/login",
  loginRateLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post("/refresh", validate(refreshSchema), AuthController.refresh);

router.get("/me", authMiddleware, AuthController.me);

router.post("/logout", authMiddleware, AuthController.logout);

router.patch(
  "/change-Password",
  authMiddleware,
  validate(changePasswordSchema),
  AuthController.changePassword
);

export default router;
