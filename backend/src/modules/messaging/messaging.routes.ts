import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as messagingController from "./messaging.controller";
import { validate } from "../../shared/middlewares/validate";
import { authenticate } from "../../shared/middlewares/authenticate";
import { sendEmailSchema } from "./dto/messaging.dto";

const router = Router();

router.use(authenticate);

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => `msg:${(req as any).user?.userId ?? "anon"}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many send requests, please wait a moment" },
});

router.post("/send", sendLimiter, validate(sendEmailSchema), messagingController.send);

export default router;
