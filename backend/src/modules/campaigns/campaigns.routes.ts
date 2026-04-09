import { Router } from "express";
import * as campaignsController from "./campaigns.controller";
import { validate } from "../../shared/middlewares/validate";
import { authenticate } from "../../shared/middlewares/authenticate";
import { createCampaignSchema, updateCampaignSchema, addContactsSchema } from "./dto/campaigns.dto";

const router = Router();

router.use(authenticate);

router.post("/", validate(createCampaignSchema), campaignsController.create);
router.get("/", campaignsController.list);
router.get("/:id", campaignsController.getById);
router.put("/:id", validate(updateCampaignSchema), campaignsController.update);

router.post("/:id/contacts", validate(addContactsSchema), campaignsController.addContacts);
router.delete("/:id/contacts/:contactId", campaignsController.removeContact);
router.get("/:id/contacts", campaignsController.getParticipants);

export default router;
