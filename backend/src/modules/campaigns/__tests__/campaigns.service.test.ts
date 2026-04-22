import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { cleanDatabase, createTestUser } from "../../../__tests__/helpers";
import * as campaignsService from "../campaigns.service";
import * as contactsService from "../../contacts/contacts.service";

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

describe("CampaignsService (integration)", () => {
  let userId: number;

  beforeEach(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    userId = user.id;
  });

  describe("createCampaign", () => {
    it("should create a campaign with draft status", async () => {
      const result = await campaignsService.createCampaign(userId, {
        name: "Q4 Launch",
        description: "Product launch",
        objective: "Get coverage",
      });
      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toBe("Q4 Launch");
      expect(result.status).toBe("draft");
    });
  });

  describe("getCampaign", () => {
    it("should return existing campaign", async () => {
      const created = await campaignsService.createCampaign(userId, {
        name: "Test", description: "", objective: "",
      });
      const result = await campaignsService.getCampaign(userId, created.id);
      expect(result.id).toBe(created.id);
    });

    it("should throw NotFoundError for non-existent campaign", async () => {
      await expect(campaignsService.getCampaign(userId, 99999)).rejects.toThrow("Campaign not found");
    });
  });

  describe("listCampaigns", () => {
    it("should list campaigns for user", async () => {
      await campaignsService.createCampaign(userId, { name: "A", description: "", objective: "" });
      await campaignsService.createCampaign(userId, { name: "B", description: "", objective: "" });
      const result = await campaignsService.listCampaigns(userId, 50, 0);
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it("should exclude archived campaigns", async () => {
      const c = await campaignsService.createCampaign(userId, { name: "Del", description: "", objective: "" });
      await campaignsService.deleteCampaign(userId, c.id);
      const result = await campaignsService.listCampaigns(userId, 50, 0);
      expect(result.total).toBe(0);
    });
  });

  describe("updateCampaign", () => {
    it("should update campaign fields", async () => {
      const c = await campaignsService.createCampaign(userId, { name: "Old", description: "d", objective: "o" });
      const updated = await campaignsService.updateCampaign(userId, c.id, { name: "New", status: "active" });
      expect(updated.name).toBe("New");
      expect(updated.status).toBe("active");
    });

    it("should throw NotFoundError for non-existent campaign", async () => {
      await expect(campaignsService.updateCampaign(userId, 99999, { name: "X" })).rejects.toThrow("Campaign not found");
    });
  });

  describe("participants", () => {
    it("should add contacts to a campaign", async () => {
      const campaign = await campaignsService.createCampaign(userId, { name: "Test", description: "", objective: "" });
      const c1 = await contactsService.createContact(userId, { name: "A", email: "a@t.com", outlet: "", topics: [] });
      const c2 = await contactsService.createContact(userId, { name: "B", email: "b@t.com", outlet: "", topics: [] });

      const result = await campaignsService.addContacts(userId, campaign.id, { contactIds: [c1.id, c2.id] });
      expect(result.added).toBe(2);
    });

    it("should handle duplicate contact additions gracefully", async () => {
      const campaign = await campaignsService.createCampaign(userId, { name: "Test", description: "", objective: "" });
      const c = await contactsService.createContact(userId, { name: "A", email: "a@t.com", outlet: "", topics: [] });

      await campaignsService.addContacts(userId, campaign.id, { contactIds: [c.id] });
      const result = await campaignsService.addContacts(userId, campaign.id, { contactIds: [c.id] });
      expect(result.added).toBe(0); // ON CONFLICT DO NOTHING
    });

    it("should list participants", async () => {
      const campaign = await campaignsService.createCampaign(userId, { name: "Test", description: "", objective: "" });
      const c = await contactsService.createContact(userId, { name: "Participant", email: "p@t.com", outlet: "CNN", topics: [] });
      await campaignsService.addContacts(userId, campaign.id, { contactIds: [c.id] });

      const participants = await campaignsService.getParticipants(userId, campaign.id);
      expect(participants).toHaveLength(1);
      expect(participants[0].contactName).toBe("Participant");
      expect(participants[0].outlet).toBe("CNN");
    });

    it("should remove a contact from campaign", async () => {
      const campaign = await campaignsService.createCampaign(userId, { name: "Test", description: "", objective: "" });
      const c = await contactsService.createContact(userId, { name: "A", email: "a@t.com", outlet: "", topics: [] });
      await campaignsService.addContacts(userId, campaign.id, { contactIds: [c.id] });

      await campaignsService.removeContact(userId, campaign.id, c.id);
      const participants = await campaignsService.getParticipants(userId, campaign.id);
      expect(participants).toHaveLength(0);
    });

    it("should throw BadRequestError for contact not owned by user", async () => {
      const campaign = await campaignsService.createCampaign(userId, { name: "Test", description: "", objective: "" });
      const otherUser = await createTestUser("other@t.com");
      const otherContact = await contactsService.createContact(otherUser.id, { name: "X", email: "x@t.com", outlet: "", topics: [] });

      await expect(
        campaignsService.addContacts(userId, campaign.id, { contactIds: [otherContact.id] })
      ).rejects.toThrow("One or more contacts do not exist or do not belong to you");
    });
  });

  describe("deleteCampaign", () => {
    it("should soft-delete a campaign", async () => {
      const c = await campaignsService.createCampaign(userId, { name: "Del", description: "", objective: "" });
      await campaignsService.deleteCampaign(userId, c.id);
      // Still retrievable but archived
      const result = await campaignsService.getCampaign(userId, c.id);
      // getCampaign does not filter by archived_at, so this works
      expect(result.id).toBe(c.id);
    });

    it("should throw NotFoundError when deleting non-existent campaign", async () => {
      await expect(campaignsService.deleteCampaign(userId, 99999)).rejects.toThrow("Campaign not found");
    });
  });
});
