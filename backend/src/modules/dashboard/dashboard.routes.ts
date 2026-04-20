import { Router } from "express";
import * as dashboardController from "./dashboard.controller";
import { authenticate } from "../../shared/middlewares/authenticate";

const router = Router();

router.use(authenticate);

router.get("/stats", dashboardController.getStats);
router.get("/activity", dashboardController.getRecentActivity);

export default router;
