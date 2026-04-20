import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as aiController from "./ai.controller";
import { validate } from "../../shared/middlewares/validate";
import { authenticate } from "../../shared/middlewares/authenticate";
import { generateOutreachSchema, rejectSuggestionSchema } from "./dto/ai.dto";

const router = Router();

router.use(authenticate);

// AI generation is expensive — strict per-user limit
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req) => `ai:${(req as any).user?.userId ?? "anon"}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many generation requests, please wait a moment" },
});

router.post("/generate", generateLimiter, validate(generateOutreachSchema), aiController.generate);
router.get("/suggestions", aiController.list);
router.get("/suggestions/:id", aiController.getById);
router.patch("/suggestions/:id/accept", aiController.accept);
router.patch("/suggestions/:id/reject", validate(rejectSuggestionSchema), aiController.reject);

export default router;
