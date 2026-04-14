import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "./auth.controller";
import { validate } from "../../shared/middlewares/validate";
import { authenticate } from "../../shared/middlewares/authenticate";
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from "./dto/auth.dto";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authLimiter, validate(refreshSchema), authController.refresh);
router.post("/logout", validate(logoutSchema), authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);
router.get("/me", authenticate, authController.me);

export default router;
