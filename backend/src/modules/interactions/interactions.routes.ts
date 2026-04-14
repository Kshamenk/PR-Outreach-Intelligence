import { Router } from "express";
import * as interactionsController from "./interactions.controller";
import { validate } from "../../shared/middlewares/validate";
import { authenticate } from "../../shared/middlewares/authenticate";
import { createInteractionSchema } from "./dto/interactions.dto";

const router = Router();

router.use(authenticate);

router.post("/", validate(createInteractionSchema), interactionsController.create);
router.get("/", interactionsController.list);
router.get("/:id", interactionsController.getById);

export default router;
