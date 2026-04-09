import { Router } from "express";
import * as contactsController from "./contacts.controller";
import { validate } from "../../shared/middlewares/validate";
import { authenticate } from "../../shared/middlewares/authenticate";
import { createContactSchema, updateContactSchema } from "./dto/contacts.dto";

const router = Router();

router.use(authenticate);

router.post("/", validate(createContactSchema), contactsController.create);
router.get("/", contactsController.list);
router.get("/:id", contactsController.getById);
router.put("/:id", validate(updateContactSchema), contactsController.update);
router.delete("/:id", contactsController.remove);

export default router;
